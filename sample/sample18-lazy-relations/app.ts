import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";
import {Category} from "./entity/Category";

const options: ConnectionOptions = {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    logging: ["query", "error"],
    synchronize: true,
    entities: [Post, Author, Category]
};

createConnection(options).then(connection => {
    const qr = connection.createQueryRunner();

    let postRepository = connection.getRepository(Post);
    let authorRepository = connection.getRepository(Author);
    let categoryRepository = connection.getRepository(Category);

    let author = authorRepository.create(qr);
    author.name = "Umed";
    
    let post = postRepository.create(qr);
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author.asPromise();
    // same as: post.author = Promise.resolve(author);

    postRepository
        .save(qr, post)
        .then(post => {
            console.log("Post has been saved. Lets save post from inverse side.");
            console.log(post);

            let secondPost = postRepository.create(qr);
            secondPost.text = "Second post";
            secondPost.title = "About second post";
            author.posts = Promise.resolve([secondPost]);
            
            return authorRepository.save(qr, author);
        })
        .then((author: any) => { // temporary
            console.log("Author with a new post has been saved. Lets try to update post in the author");

            return author.posts!.then((posts: any) => {  // temporary
                posts![0]!.title = "should be updated second post";
                return authorRepository.save(qr, author!);
            });
        })
        .then(updatedAuthor => {
            console.log("Author has been updated: ", updatedAuthor);
            console.log("Now lets load all posts with their authors:");
            return postRepository.find(qr, { join: { alias: "post", leftJoinAndSelect: { author: "post.author" } } });
        })
        .then(posts => {
            console.log("Posts are loaded: ", posts);
            console.log("Now lets delete a post");
            posts[0].author = Promise.resolve(null);
            posts[1].author = Promise.resolve(null);
            return postRepository.save(qr, posts[0]);
        })
        .then(posts => {
            console.log("Two post's author has been removed.");  
            console.log("Now lets check many-to-many relations");
            
            let category1 = categoryRepository.create(qr);
            category1.name = "Hello category1";
            
            let category2 = categoryRepository.create(qr);
            category2.name = "Bye category2";
            
            let post = postRepository.create(qr);
            post.title = "Post & Categories";
            post.text = "Post with many categories";
            post.categories = Promise.resolve([
                category1,
                category2
            ]);
            
            return postRepository.save(qr, post);
        })
        .then(posts => {
            console.log("Post has been saved with its categories. ");
            console.log("Lets find it now. ");
            return postRepository.find(qr, { join: { alias: "post", innerJoinAndSelect: { categories: "post.categories" } } });
        })
        .then(posts => {
            console.log("Post with categories are loaded: ", posts);
            console.log("Lets remove one of the categories: ");
            return posts[0].categories.then((categories: any) => {  // temporary
                categories!.splice(0, 1);
                // console.log(posts[0]);
                return postRepository.save(qr, posts[0]);
            });
        })
        .then(posts => {
            console.log("One of the post category has been removed.");
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));

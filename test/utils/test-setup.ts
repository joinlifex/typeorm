import "source-map-support/register";
import "reflect-metadata";
import * as chai from "chai";
import sinon from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

chai.should();
chai.use(sinon);
chai.use(chaiAsPromised);

export default chai;
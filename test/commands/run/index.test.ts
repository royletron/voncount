import { expect, test } from "@oclif/test";

describe("run", () => {
  test
    .stdout()
    .command(["run", "./example/makeStyles"])
    .it("runs hello cmd", (ctx) => {
      console.log(ctx.stdout);
      expect(ctx.stdout).to.contain("hello friend from oclif!");
    });
});

// Upload steps that name the file field by its label, so features stay readable.
const path = require('path');
const { When } = require('@cucumber/cucumber');
const { smartSettle } = require('@vardot/varbase-e2e/tests/step-definitions/varbase-e2e');

/**
 * Attach a file from tests/assets to the file field with this label, or to a
 * field named in the selector registry when no label matches.
 *
 * Example #1: When I attach the file "house.jpg" to the "Add a new file" field
 * Example #2: And I attach the file "landscape.jpg" to the "Add a new file" field
 * Example #3: When we attach the file "report.pdf" to the "Document" field
 * Example #4: When I attach file "logo.png" to the "Logo" field
 * Example #5: And I attach the file "photo.jpg" to the "image upload" field
 */
When(/^(?:I |we )*attach(?: the)* file "([^"]*)" to the "([^"]*)" field$/, async function (file, field) {
  let target = this.page.getByLabel(field, { exact: true }).first();
  if (await target.count() === 0) {
    const named = (this.__selectorsCss || {})[field];
    if (!named) {
      throw new Error(`Could not attach "${file}": no file field is labelled "${field}" and no selector has that name.`);
    }
    target = this.page.locator(named).first();
  }
  await target.setInputFiles(path.resolve(this.assetsFolder, file));
  await smartSettle(this.page, 1500);
});

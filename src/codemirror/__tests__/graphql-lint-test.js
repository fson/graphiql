/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */
import { expect } from 'chai';
import { describe, it } from 'mocha';
import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';
import '../lint/graphql-lint';
import { TestSchema } from './testSchema';
import { readFileSync } from 'fs';
import { join } from 'path';

/* eslint-disable max-len */

function createEditorWithLint(lintConfig) {
  return CodeMirror(document.createElement('div'), {
    mode: 'graphql',
    lint: lintConfig ? lintConfig : true
  });
}

function printLintErrors(queryString) {
  let editor = createEditorWithLint({
    schema: TestSchema
  });

  return new Promise((resolve, reject) => {
    editor.state.lint.options.onUpdateLinting = (errors) => {
      if (errors && errors[0]) {
        if (!errors[0].message.match('Unexpected EOF')) {
          resolve(errors);
        }
      }
      reject();
    };
    editor.doc.setValue(queryString);
  }).then((errors) => {
    return errors;
  }).catch(() => {
    return [];
  });
}

describe('graphql-lint', () => {
  it('attaches a GraphQL lint function with correct mode/lint options', () => {
    let editor = createEditorWithLint();
    expect(
      editor.getHelpers(editor.getCursor(), 'lint')
    ).to.not.have.lengthOf(0);
  });

  it('catches syntax errors', async () => {
    expect(
      (await printLintErrors(`qeury`))[0].message
    ).to.contain(
`Unexpected Name "qeury"`
    );
  });

  it('catches field validation errors', async () => {
    expect(
      (await printLintErrors(`query queryName { title }`))[0].message
    ).to.contain(
`Cannot query field "title" on "Test".`
    );
  });

  var kitchenSink = readFileSync(
    join(__dirname, '/kitchen-sink.graphql'),
    { encoding: 'utf8' }
  );

  it('returns no syntactic/validation errors after parsing kitchen-sink query', async () => {
    let errors = await printLintErrors(kitchenSink);
    expect(errors).to.have.lengthOf(0);
  });
});

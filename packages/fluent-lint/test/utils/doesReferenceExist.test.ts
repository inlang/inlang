import {
    Identifier,
    NumberLiteral,
    Pattern,
    Placeable,
    SelectExpression,
    TextElement,
    VariableReference,
    Variant,
} from '@inlang/fluent-syntax';
import { doesReferenceExist } from '../../src/utils/doesReferenceExist';

it('should find variable reference', () => {
    const reference = new VariableReference(new Identifier('numApples'));
    const pattern = new Pattern([
        new TextElement('Hello '),
        new Placeable(new VariableReference(new Identifier('userName'))),
        new TextElement(' you have'),
        new Placeable(
            new SelectExpression(reference, [
                new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
                new Variant(
                    new Identifier('other'),
                    new Pattern([new Placeable(reference), new TextElement('apples.')]),
                    true
                ),
            ])
        ),
    ]);
    const result = doesReferenceExist({ reference, pattern });
    expect(result).toBe(true);
});

it('should return false for non-existent variable reference', () => {
    const pattern = new Pattern([
        new TextElement('Hello '),
        new Placeable(new VariableReference(new Identifier('userName'))),
        new TextElement(' you have'),
        new Placeable(
            new SelectExpression(new VariableReference(new Identifier('numApples')), [
                new Variant(new Identifier('one'), new Pattern([new TextElement('one apple.')]), false),
                new Variant(
                    new Identifier('other'),
                    new Pattern([
                        new Placeable(new VariableReference(new Identifier('numApples'))),
                        new TextElement('apples.'),
                    ]),
                    true
                ),
            ])
        ),
    ]);
    const result = doesReferenceExist({ reference: new VariableReference(new Identifier('non-existend')), pattern });
    expect(result).toBe(false);
});

it('should find a reference that is nested in placeables.', () => {
    const reference = new VariableReference(new Identifier('nested-in-placeables'));
    const pattern = new Pattern([
        new Placeable(new NumberLiteral('5')),
        new Placeable(new Placeable(new Placeable(reference))),
        new TextElement('apples.'),
    ]);

    const result = doesReferenceExist({
        reference,
        pattern,
    });
    expect(result).toBe(true);
});

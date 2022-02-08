import { Identifier, Message, Pattern, Placeable, Resource, TextElement, VariableReference } from '@fluent/syntax';
import { mergeSingleResources } from '../../src/utils/mergeSingleResources';

it('should merge two resources and thereby update the pattern of a message', () => {
    const source = new Resource([
        new Message(new Identifier('test'), new Pattern([new TextElement('this is my updated test message')])),
    ]);
    const target = new Resource([
        new Message(new Identifier('test'), new Pattern([new TextElement('this is my test message')])),
    ]);
    const result = mergeSingleResources({ source, target });
    expect(((result.body[0] as Message).value?.elements[0] as TextElement).value).toEqual(
        'this is my updated test message'
    );
});

it('should merge two resources where the target resource gets an entirely new message', () => {
    const source = new Resource([
        new Message(new Identifier('test'), new Pattern([new TextElement('this is my updated test message')])),
    ]);
    // target is an empty resource
    const target = new Resource();
    const result = mergeSingleResources({ source, target });
    expect(((result.body[0] as Message).value?.elements[0] as TextElement).value).toEqual(
        'this is my updated test message'
    );
});

it('should not mutate the target object', () => {
    const source = new Resource([
        new Message(new Identifier('test'), new Pattern([new TextElement('this is my updated test message')])),
    ]);
    // target is an empty resource
    const target = new Resource();
    const result = mergeSingleResources({ source, target });
    expect(target.body.length === 0).toBeTruthy();
    expect(result.body.length === 1).toBeTruthy();
});

it('should merge entries that dont exist in each others', () => {
    const source = new Resource([
        new Message(new Identifier('test'), new Pattern([new TextElement('this is my test')])),
    ]);
    const target = new Resource([
        new Message(new Identifier('hello'), new Pattern([new TextElement('hello there')])),
        new Message(new Identifier('extra'), new Pattern([new TextElement('a key without translations ')])),
    ]);
    const result = mergeSingleResources({ source, target });
    console.log(result);
    const ids = result.body.map((entry) => (entry.id as Identifier).name);
    console.log(ids);
    expect(ids).toEqual(['test', 'hello', 'extra']);
});

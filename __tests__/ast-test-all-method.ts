import generate from '@babel/generator';
import * as t from '@babel/types';
import { methodToAst } from '../src/index'
import AllMethodJson from '../example-methods.json';

const expectCode = (ast) => {
    expect(
        generate(ast).code
    ).toMatchSnapshot();
}

it('works', () => {
    const keys = Object.keys(AllMethodJson)
    keys.forEach((key) => {
        const config = {};
        expectCode(methodToAst({
            [key]: AllMethodJson[key]
        }));
    })

});
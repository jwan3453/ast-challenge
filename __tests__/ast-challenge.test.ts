import generate from '@babel/generator';
import * as t from '@babel/types';
import { methodToAst } from '../src/index'

const expectCode = (ast) => {
    expect(
        generate(ast).code
    ).toMatchSnapshot();
}

// default method config 
const defaultMethod = {
    "Pools": {
        "requestType": "QueryPoolsRequest",
        "responseType": "QueryPoolsResponse"
    }
}

// pass the following dynamicConfig as the second paramater 
// if you want to generate dynamic hooks

// const dynamicConfig = {
//     queryInterface: 'UseFooQuery',
//     hookName: 'useFoo',
//     requestType: 'QueryFooRequest',
//     responseType: 'QueryFooResponse',
//     queryServiceMethod: 'foo',
//     keyName: 'fooQuery',
// }

it('works', () => {
    expectCode(methodToAst(defaultMethod));
});

import * as t from '@babel/types';

const REQUEST_TYPE_KEY = 'requestType';
const RESPONSE_TYPE_KEY = 'responseType';

type Params = {
    queryInterface?: string,
    hookName?: string,
    requestType?: string,
    responseType?: string,
    queryServiceMethod?: string,
    keyName?: string,
};

type ConfigItem = {
    [key: string]: {
        requestType: string;
        responseType: string;
    }
}

/**
 * generate the inteface ts code from config
 */
const generateExportInterfaceType = ({
    queryInterface,
    requestType,
    responseType,
}: Params) => {

    // generate the extend clause
    const extendsClause = [
        t.tsExpressionWithTypeArguments(
            t.identifier('ReactQueryParams'),
            t.tsTypeParameterInstantiation([
                t.tsTypeReference(t.identifier(responseType)),
                t.tsTypeReference(t.identifier('TData'))
            ])
        )
    ];

    // generate interface property
    let requestProperty = t.tsPropertySignature(
        t.identifier('request'),
        t.tsTypeAnnotation(
            t.tsTypeReference(t.identifier(requestType))
        ),
    );
    requestProperty.optional = true

    // create the interface declaration
    const finalDeclaration =
        t.exportNamedDeclaration(
            t.tsInterfaceDeclaration(
                t.identifier(queryInterface),
                t.tsTypeParameterDeclaration([t.tsTypeParameter(null, null, 'TData'),]),
                extendsClause,
                t.tsInterfaceBody([
                    requestProperty
                ])
            ),
            []
        );
    return finalDeclaration;
}

/**
 * generate the hook function ts code from config
 */
const generateHookFunctionType = ({
    queryInterface,
    hookName,
    responseType,
    queryServiceMethod,
    keyName,
}: Params) => {

    const typeParameter = t.tsTypeParameter(
        undefined,
        t.tsTypeReference(t.identifier(responseType)),
        'TData'
    );


    // function parameter
    const paramsPattern = t.objectPattern([t.objectProperty(
        t.identifier('request'),
        t.identifier('request'),
        false,
        true
    ),
    t.objectProperty(
        t.identifier('options'),
        t.identifier('options'),
        false,
        true
    )]);

    // build function paramater type annotation
    const paramTypeAnnotation = t.tsTypeAnnotation(
        t.tsTypeReference(
            t.identifier(queryInterface),
            t.tsTypeParameterInstantiation([t.tsTypeReference(t.identifier('TData'))])
        )
    );

    paramsPattern.typeAnnotation = paramTypeAnnotation;

    // build if statement
    const ifStatement = t.ifStatement(
        t.unaryExpression('!', t.identifier('queryService')),
        t.blockStatement([
            t.throwStatement(
                t.newExpression(t.identifier('Error'), [
                    t.stringLiteral('Query Service not initialized')
                ])
            )
        ])
    );

    //build return statement
    const returnStatement = t.returnStatement(
        t.callExpression(
            t.memberExpression(t.identifier('queryService'), t.identifier(queryServiceMethod)),
            [t.identifier('request')]
        )
    );

    const arrowFunctionBody = t.blockStatement([ifStatement, returnStatement]);

    // build useQuery statement
    const useQueryCall = t.callExpression(
        t.identifier('useQuery'),
        [
            t.arrayExpression([t.stringLiteral(keyName), t.identifier('request')]),
            t.arrowFunctionExpression([], arrowFunctionBody),
            t.identifier('options')
        ]
    );

    useQueryCall.typeParameters = t.tsTypeParameterInstantiation([
        t.tsTypeReference(t.identifier(responseType)),
        t.tsTypeReference(t.identifier('Error')),
        t.tsTypeReference(t.identifier('TData'))
    ]);

    // build return statement
    const useQueryReturnStatement = t.returnStatement(useQueryCall);

    const arrowFunction = t.arrowFunctionExpression(
        [paramsPattern],
        t.blockStatement([useQueryReturnStatement]),
        false
    );

    // Add type parameters to function
    arrowFunction.typeParameters = t.tsTypeParameterDeclaration([typeParameter]);


    // Create final declaration
    const finalDeclaration = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(hookName), arrowFunction)
    ]);


    return finalDeclaration
}


export const methodToAst = (methodConfig: ConfigItem, dynamicParams?: Params) => {

    // get default config values
    const methodConfigItem = Object.keys(methodConfig)[0];
    const defaultRequestTypeValue = methodConfig[methodConfigItem][REQUEST_TYPE_KEY]
    const defaultResponseTypeValue = methodConfig[methodConfigItem][RESPONSE_TYPE_KEY]

    const {
        queryInterface,
        hookName,
        requestType,
        responseType,
        queryServiceMethod,
        keyName,
    } = dynamicParams || {};
    return t.file
        (
            t.program([
                generateExportInterfaceType({
                    queryInterface: queryInterface || `Use${methodConfigItem}Query`,
                    requestType: requestType || defaultRequestTypeValue,
                    responseType: responseType || defaultResponseTypeValue,
                }),
                generateHookFunctionType({
                    queryInterface: queryInterface || `Use${methodConfigItem}Query`,
                    hookName: hookName || `use${methodConfigItem}`,
                    responseType: responseType || defaultResponseTypeValue,
                    queryServiceMethod: queryServiceMethod || methodConfigItem.toLocaleLowerCase(),
                    keyName: keyName || `${methodConfigItem.toLocaleLowerCase()}Query`
                })
            ]
            )
        )
}

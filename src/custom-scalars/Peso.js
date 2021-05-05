const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { isString } = require( 'lodash');

function generatePeso(value) {
    if (!parseFloat(value)) {
      throw new TypeError(
        `Peso cannot represent non-number type ${JSON.stringify(value)}`
      );
    }
    
    const pesoJS = new Intl.NumberFormat('ph-PH', {style: 'currency', currency: 'PHP'}).format(value);
    const peso = pesoJS.replace('PHP', '₱').replace(' ', '');
    
    return peso;
}
  
function generateNumber(value) {
  const digits = value.replace('₱', '').replace(',', '');
  const number = parseFloat(digits);
  return number;
}
  
/**
 * An Peso Scalar.
 *
 * Input:
 *    This scalar takes a peso string as input and
 *    formats it to number.
 *
 * Output:
 *    This scalar serializes number to
 *    peso strings.
 */
const config = {
  name: 'Peso',
  description: 'Turn numbers to peso format vice-versa.',
  serialize: generatePeso,
  parseValue(value) {
    if (!isString(value)) {
      throw new TypeError(
        `Peso cannot represent non-string type ${JSON.stringify(value)}`
      );
    }

    if (isString(value)) {
      return generateNumber(value);
    }
    throw new TypeError(
      `Peso cannot represent an invalid format ${value}.`
    );
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isString(ast.value)) {
        return generateNumber(ast.value);
      }
    }
    throw new TypeError(
      `Peso cannot represent an invalid format ${ast.value}.`
    );
  },
};

module.exports = new GraphQLScalarType(config);
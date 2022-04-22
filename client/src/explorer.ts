///esModuleIn
import * as vscode from 'vscode'
import { parse, Node } from 'wollok-ts'

//const tokenTypes = ['Parameter', 'ParameterizedType', 'NamedArgument', 'Import', 'Body', 'Catch', 'Package', 'Program', 'Test', 'Class', 'Singleton', 'Mixin', 'Describe', 'Variable', 'Field', 'Method', 'Return', 'Assignment', 'Reference', 'Self', 'Literal', 'Send', 'Super', 'New', 'If', 'Throw', 'Try', 'Environment']
const tokenModifiers = ['declaration', 'definition', 'documentation', 'keyword']
const tokenTypeObj = {
  'Parameter': 'parameter',
  'ParameterizedType': 'property',
  'NamedArgument': 'property',
  'Import': 'namespace',
  'Body': 'property',
  'Catch': 'property',
  'Package': 'property',
  'Program': 'property',
  'Test': 'function',
  'Singleton': 'object', //'entity.name.type.class',//
  'Mixin': 'property',
  'Describe': 'property',
  'Variable': 'variable',
  'Field': 'property',
  'Method': 'method', //'entity.name.function.member',
  'Return': 'keyword',
  'Assignment': 'property',
  'Reference': 'property',
  'Self': 'property',
  'Literal': 'property',
  'Literal_number': 'number',
  'Literal_string': 'string',
  'Send': 'property',
  'Super': 'property',
  'New': 'property',
  'If': 'property',
  'Throw': 'property',
  'Try': 'property',
  'Environment': 'property',
  'Class': 'class', //'class', //'entity.name.type.class',

  'Keyword': 'keyword',
  'Unknow': 'unknow',
}

const tokenTypeModifierObj = {
  'Parameter': ['declaration'],
  'ParameterizedType': ['declaration'],
  'NamedArgument': ['declaration'],
  'Import': ['declaration'],
  'Body': ['declaration'],
  'Catch': ['declaration'],
  'Package': ['declaration'],
  'Program': ['declaration'],
  'Test': ['declaration'],
  'Singleton': ['declaration'],
  'Mixin': ['declaration'],
  'Describe': ['declaration'],
  'Variable': ['declaration'],
  'Field': ['declaration'],
  'Method': ['declaration'],
  'Return': ['declaration'],
  'Assignment': ['declaration'],
  'Reference': ['declaration'],
  'Self': ['declaration'],
  'Literal': ['declaration'], //['readonly'],
  'Literal_number': ['declaration'], //['readonly'],
  'Literal_string': ['declaration'], //['readonly'],
  'Send': ['declaration'],
  'Super': ['declaration'],
  'New': ['declaration'],
  'If': ['declaration'],
  'Throw': ['declaration'],
  'Try': ['declaration'],
  'Environment': ['declaration'],
  'Class': ['declaration'], //'class', //'entity.name.type.class',

  //TODO:este rompia....!!!
  'Keyword': ['declaration'], //['static'],
  //['readonly'],
  //'Unknow': 'unknow',
}
//Standard token types:
//ID	Description
const tokenTypes = [
  'namespace', //	For identifiers that declare or reference a namespace, module, or package.
  'class', //	For identifiers that declare or reference a class type.
  'object', //No es parte de los tipos por default
  'enum', //	For identifiers that declare or reference an enumeration type.
  'interface', //	For identifiers that declare or reference an interface type.
  'struct', //	For identifiers that declare or reference a struct type.
  'typeParameter', //	For identifiers that declare or reference a type parameter.
  'type', //	For identifiers that declare or reference a type that is not covered above.
  'parameter', //	For identifiers that declare or reference a function or method parameters.
  'variable', //	For identifiers that declare or reference a local or global variable.
  'property', //	For identifiers that declare or reference a member property, member field, or member variable.
  'enumMember', //	For identifiers that declare or reference an enumeration property, constant, or member.
  'decorator', //	For identifiers that declare or reference decorators and annotations.
  'event', //	For identifiers that declare an event property.
  'function', //	For identifiers that declare a function.
  'method', //	For identifiers that declare a member function or method.
  'macro', //	For identifiers that declare a macro.
  'label', //	For identifiers that declare a label.
  'comment', //	For tokens that represent a comment.
  'string', //	For tokens that represent a string literal.
  'keyword', //	For tokens that represent a language keyword.
  'number', //	For tokens that represent a number literal.
  'regexp', //	For tokens that represent a regular expression literal.
  'operator', //	For tokens that represent an operator.
]
/*
Standard token modifiers:

ID	Description
declaration	For declarations of symbols.
definition	For definitions of symbols, for example, in header files.
readonly	For readonly variables and member fields (constants).
static	For class members (static members).
deprecated	For symbols that should no longer be used.
abstract	For types and member functions that are abstract.
async	For functions that are marked async.
modification	For variable references where the variable is assigned to.
documentation	For occurrences of symbols in documentation.
defaultLibrary	For symbols that are part of the standard library.
*/

export const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers)

type NodePlotter = {
  range: vscode.Range
  tokenType: string
  tokenModifiers?: string[]
}

const keywords = {
  /*
  'Parameter':'property',
  'ParameterizedType':'property',
  'NamedArgument':'property',
  'Import':'property',
  'Body':'property',
  'Catch':'property',
  'Package':'property',
  'Program':'property',
  'Test':'function',
  */
  'Singleton': 'object',
  //'Mixin':'property',
  //'Describe':'property',
  'Variable': 'var',
  'Field':'var',
  'Method': 'method',
  'Return': 'return',
  'Assignment':'=',
  //'Reference':'property',
  'Self':'self',
  /*'Literal':'property',
  'Send':'property',
  'Super':'property',
  'New':'property',
  'If':'property',
  'Throw':'property',
  'Try':'property',
  'Environment':'property',
  */
  'Class': 'class',
}

function plotter(start: { ln, col, len }, kind: string): NodePlotter {
  return {
    range: new vscode.Range(
      new vscode.Position(start.ln, start.col),
      new vscode.Position(start.ln, start.col + start.len),
    ),
    tokenType: tokenTypeObj[kind],
    tokenModifiers: tokenTypeModifierObj[kind],
  }
}

/*
function procesar(node: PackageNode)
function procesar(node: ProgramNode)
function procesar(node: ClassNode)
*/
function procesar(node: Node, documentoStr: string[]) {
  //const subStr = documentoStr.substring(node.sourceMap.start.offset, node.sourceMap.end.offset)
  //if (node.is('Method') || node.is('Field'))
  const subStr = documentoStr[node.sourceMap.start.line-1] //(offset, node.sourceMap.end.offset)

  if (node.is('Class')) {
    const col = subStr.indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Singleton')) {
    const col = subStr.indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Field')) {
    const col = subStr.indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Reference')) {
    //node.variable
    //node.value
    //TODO: Si previamente hay un campo del mismo nombre no se toma
    //TODO: los parametros o propiedades se toman como nuevas referencias
    const columnMap = node.sourceMap.start.column
    const col = columnMap + subStr.substring(columnMap).indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Assignment')) {
    //node.variable
    //node.value
    const col = subStr.indexOf(node.variable.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.variable.name.length }, node.kind)
  }
  if (node.is('Parameter')){
    const col = subStr.indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Method')) {
    const col = subStr.indexOf(node.name)
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: node.name.length }, node.kind)
  }
  if (node.is('Literal')) {
    const tipo = typeof node.value
    const token =
      tipo == 'number' || tipo == 'bigint'? 'Literal_number':
      tipo == 'string'? 'Literal_string':
      //tipo == 'boolean'? 'Singleton':
      //tipo == 'symbol' && node.value == null? 'Singleton':
      //'Unknow'
      ''
    if (token == '') return undefined
    const valor = node.value.toString()
    let col = subStr.indexOf(valor)
    col = token == 'Literal_string'? col - 1: col
    const len = token == 'Literal_string'? valor.length + 2: valor.length
    return plotter({ ln: node.sourceMap.start.line-1, col: col, len: len }, token)
  }
  if(node.is('Assignment')){
    return undefined //plotter({ln: node.sourceMap.start.line, col:node.sourceMap.start.column, len:5}, node.kind)
  }
  //if(node.is())
  //  return plotter({ln: node.sourceMap.start.line, col:node.sourceMap.start.column, len:5}, node.kind)
  //[...children, plotter(node)]
  else
    return undefined //children
}


function processNode(node: Node, documentoStr: string[]): NodePlotter[] {
  return node.reduce((acum, node: Node) => //acum.concat(procesar(node))
  {
    const curretKeyboard = keywords[node.kind]
    if (curretKeyboard !== undefined){
      const subStr = documentoStr[node.sourceMap.start.line-1]
      const col = subStr.indexOf(curretKeyboard)
      const plotKeyboard = plotter({ ln: node.sourceMap.start.line-1, col: col, len: curretKeyboard.length }, 'Keyword')

      return acum.concat(procesar(node, documentoStr)).concat(plotKeyboard)
    }
    return acum.concat(procesar(node, documentoStr))
  }, [])
}

function separarLineas(text: string) {
  return text.split('\n')
}

export const provider: vscode.DocumentSemanticTokensProvider = {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    // analyze the document and return semantic tokens

    const tokensBuilder = new vscode.SemanticTokensBuilder(legend)
    const parsedFile = parse.File(document.fileName)
    const docText = document.getText()
    const tp = parsedFile.tryParse(docText)

    const processed = processNode(tp.members[0], separarLineas(docText)).filter(x => x !== undefined)
    processed.forEach((x: NodePlotter) =>
      tokensBuilder.push(x.range, x.tokenType, x.tokenModifiers)
    )

    return tokensBuilder.build()
  },
}
export const selector = { language: 'wollok', scheme: 'file' }
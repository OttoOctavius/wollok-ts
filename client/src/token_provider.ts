import { plotter, NodePlotter, keywords } from './highlighterDef'
import { Node, Singleton } from 'wollok-ts'

function extraerLineaColumna(node: Node, documentoStr: string[]) {
  const linea = node.sourceMap.start.line-1
  const columna = node.sourceMap.start.column-1

  return {
    linea: linea,
    columna: columna,
    subStr:documentoStr[linea].substring(columna),
  }
}

function procesar(node: Node, documentoStr: string[]) {
  return node.match({
    Class: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Singleton: node => {
      if(node.sourceMap == undefined) return undefined
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Field: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Variable: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr
        //.substring(node.sourceMap.start.column-1)
        .indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Reference: node => {
      //node.variable
      //node.value
      //TODO: Si previamente hay un campo del mismo nombre no se toma
      //TODO: los parametros o propiedades se toman como nuevas referencias
      if(node.name == 'wollok.lang.Closure')
        return undefined
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr
        //.substring(columna)
        .indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Assignment: node => {
      //node.variable
      //node.value
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.variable.name)
      return plotter({ ln: linea, col: col, len: node.variable.name.length }, node.kind)
    },
    Parameter: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Method: node => {
      if(node.name == '<apply>'){ //es un singleton closure
        return undefined
      }
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
    },
    Send: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      if(node.message == 'negate'){
        const negateC = subStr.indexOf('!')
        if(negateC == -1){
          const col = columna + subStr.indexOf('not')
          return plotter({ ln: linea, col: col, len: 3 }, node.kind)
        }
        return plotter({ ln: linea, col: columna + negateC, len: 1 }, node.kind)
      }
      const col = columna + subStr.indexOf(node.message)
      return plotter({ ln: linea, col: col, len: node.message.length }, node.kind)
    },
    Return: _ => {
      return undefined
    },
    Literal: node => {
      const tipo = typeof node.value
      if(tipo == 'object'){
        const closure = node.value as Singleton
        if(closure){
          //Literal<Singleton> es un Closure. contiene Field y Method
          /*closure.forEach(nodo => {
            nodo
          })*/
        }
        return undefined//plotter({ ln: linea, col: col, len: len }, 'Singleton')
      }
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      switch (tipo) {
        case 'number':
        case 'bigint':
          const valor_numerico = node.value.toString()
          return plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_numerico),
            len: valor_numerico.length,
          }, 'Literal_number')
        case 'boolean':
          const valor_booleano = node.value.toString()
          return plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_booleano),
            len: valor_booleano.length,
          }, 'Literal_bool')
        case 'string':
          const valor_string = node.value.toString()
          return plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_string) - 1,
            len: valor_string.length + 2,
          }, 'Literal_string')
        default:
          return undefined
      }
    },
    Package: node => undefined,
    Import:  node => undefined,
    Program: node => undefined,
    Body:    node => undefined,
    Entity:  node => undefined,
    Sentence:node => undefined,
    Expression:  node => {
      return undefined
    },
    Catch: node => undefined,
    Test:  node => undefined,
    ParameterizedType: node => {
      //closure, fix no funciona
      return undefined
    },
    NamedArgument:    node => undefined,

    Mixin:  node => undefined,
    Describe: node => undefined,

    Environment:  node => undefined,
    Try: node => undefined,
    Throw:    node => undefined,

    If: node => {
      console.log(node)
      return undefined
    },
    New: node => {
      return undefined
    },
    Super: node => {
      return undefined
    },
  })
}


function excepcionKeyword(node: Node, mapKeyword: string|string[]){
  if(node.kind == 'Singleton'){
    return node.members.reduce((prev, curr) => !curr.name.startsWith('<') && prev, true)
  }
  if(node.kind == 'Method'){
    return node.name!='<apply>'
  }
  /*if(node.kind == 'Send'){
    return mapKeyword.includes(node.message)
  }*/
  return true
}

export function processCode(node: Node, documentoStr: string[]): NodePlotter[] {
  return node.reduce((acum, node: Node) =>
  {
    let curretKeyboard = keywords[node.kind]
    if (curretKeyboard !== undefined && excepcionKeyword(node, curretKeyboard)){
      //||node.kind == 'Send'){
      if(node.kind == 'Variable'){
        curretKeyboard = node.isConstant? 'const':'var'
      }
      if(node.kind == 'Send'){
        curretKeyboard = node.message
      }
      const { linea, columna,  subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(curretKeyboard)
      const plotKeyboard = plotter({ ln: linea, col: col, len: curretKeyboard.length }, 'Keyword')

      return acum.concat(procesar(node, documentoStr)).concat(plotKeyboard)
    }
    return acum.concat(procesar(node, documentoStr))
  }, [])
}

//TODO: al no poder procesar comentarios multilinea se transforma a comentarios comunes.
function plotterMultiLinea(arr: any[]) {
  return arr.map( x => plotter(x, 'Comment'))
}

type ProcesamientoComentario = {
  result: NodePlotter[];
  multilinea?: {
    ln: number,
    col: number,
    len: number
  }[]
  firstLineMC?: number;
  presetIndex?: number;
}

export function processComments(docText: string[]): NodePlotter[] {
  return docText.reduce( processCommentLine, { result:[], multilinea:undefined }).result

  function processCommentLine(acum: ProcesamientoComentario, strln, linea) {
    const indL = strln.indexOf('//')
    const indM = strln.indexOf('/*')
    const presetIndex: number = acum.presetIndex || 0

    if (acum.multilinea !== undefined) {
      const indMf = strln.indexOf('*/')
      if (indMf >= 0) {
        const newLen = indMf + 2 + presetIndex
        const plot = acum.firstLineMC !== undefined?
          { ln: linea, col: acum.firstLineMC, len: indMf + 4 }:
          { ln: linea, col: presetIndex, len: strln.length - presetIndex }
        const temp = plotterMultiLinea([...acum.multilinea, plot])
        const tempconcat = acum.result.concat(temp)
        return processCommentLine({
          result: tempconcat,
          presetIndex: newLen,
        }, strln.substring(indMf + 2), linea)
      } else {
        const plot = acum.firstLineMC !== undefined?
          { ln: linea, col: acum.firstLineMC, len: strln.length + 2 }:
          { ln: linea, col: presetIndex,      len: strln.length }
        return { result: acum.result, multilinea: [...acum.multilinea, plot] }
      }
    }
    //hay un comentario de linea y comienza antes de un posible comentario multilinea
    if (indL != -1 && (indM == -1 || indL < indM)) {
      return {
        result: [
          ...acum.result,
          plotter({ ln: linea, col: indL + presetIndex, len: strln.length - indL }, 'Comment'),
        ],
      }
    }
    //hay un comentario multi-linea y comienza antes de un posible comentario de linea
    if (indM != -1 && (indL == -1 || indM < indL)) {
      return processCommentLine({
        result: acum.result,
        multilinea: [],
        firstLineMC: indM + presetIndex,
        presetIndex: indM + 2 + presetIndex,
      }, strln.substring(indM + 2), linea)
    }
    return { ...acum, presetIndex: undefined }
  }
}

//ResponseError: Unhandled method workspace/configuration
import { plotter, NodePlotter, keywords, tokenTypeObj } from './highlighterDef'
import { Node, Singleton } from 'wollok-ts'

//Nota: no todos los node's tienen .start (dando undefined), pueden provocar excepciones.
function extraerLineaColumna(node: Node, documentoStr: string[]) {
  const linea = node.sourceMap.start.line-1
  const columna = node.sourceMap.start.column-1

  return {
    linea: linea,
    columna: columna,
    subStr:documentoStr[linea].substring(columna),
  }
}

function procesar(node: Node, documentoStr: string[], context: NodeContext[]) {
  const generar_plotter = node => {
    const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
    const col = columna + subStr.indexOf(node.name)
    return plotter({ ln: linea, col: col, len: node.name.length }, node.kind)
  }
  const keyword_plotter = (node, mensaje) => {
    const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
    const col = columna + subStr.indexOf(mensaje)
    return plotter({ ln: linea, col: col, len: mensaje.length }, 'Keyword')
  }
  const save_reference = node => { return { name: node.name, type: node.kind }}
  const drop_reference = node => { return { result: node, references: undefined }}
  const null_case = { result: undefined, references: undefined }

  if(node.kind === 'New' || node.kind === 'Self' || node.kind === 'If'){ //por alguna razon no hace match
    return drop_reference(keyword_plotter(node, keywords[node.kind]))
  }

  return node.match({
    Class: node => {
      const acum = []
      acum.push(keyword_plotter(node, 'class'))
      node.supertypes.length>0 && acum.push(keyword_plotter(node, 'inherits'))
      acum.push(generar_plotter(node))
      return { result: acum, references: save_reference(node) }
    },
    Singleton: node => {
      if(node.sourceMap == undefined) return null_case
      const acum = []
      node.members.reduce((prev, curr) => !curr.name.startsWith('<') && prev, true)
        && acum.push(keyword_plotter(node, keywords[node.kind]))
      acum.push(generar_plotter(node))
      return { result: acum, references: save_reference(node) }
    },
    Field: node => {
      //if(node.c == '<toString>') return null_case
      return {
        result: [
          generar_plotter(node),
          keyword_plotter(node, keywords[node.kind]),
        ],
        references: save_reference(node),
      }
    },
    Variable: node => {
      return {
        result: [
          generar_plotter(node),
          keyword_plotter(node, node.isConstant? 'const':'var'),
        ],
        references: save_reference(node),
      }
    },
    Reference: node => {
      //node.variable
      //node.value
      //TODO: Si previamente hay un campo del mismo nombre no se toma
      //TODO: los parametros o propiedades se toman como nuevas referencias
      if(node.name == 'wollok.lang.Closure')
        return null_case

      const referencia  = context.find(x => x.name==node.name)
      const pl = generar_plotter(node)
      if(referencia){
        pl.tokenType = tokenTypeObj[referencia.type]
      }
      return { result: pl, references: undefined } //no agrego informacion
    },
    Assignment: node => {
      //node.variable
      //node.value
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.variable.name)
      return {
        result: [
          plotter({ ln: linea, col: col, len: node.variable.name.length }, node.kind),
          keyword_plotter(node, keywords[node.kind]),
        ], references: undefined,
      }
    },
    Parameter: node => {
      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)
      return {
        result: plotter({ ln: linea, col: col, len: node.name.length }, node.kind),
        references: undefined,
      }
    },
    Method: node => {
      if(node.name == '<apply>'){ //es un singleton closure
        return null_case
      }

      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      const col = columna + subStr.indexOf(node.name)

      return {
        result: [
          plotter({ ln: linea, col: col, len: node.name.length }, node.kind),
          keyword_plotter(node, keywords[node.kind]),
        ], references: undefined,
      }
    },
    Send: node => {
      const curretKeyboard = keywords[node.kind]
      const { linea, columna,  subStr } = extraerLineaColumna(node, documentoStr)
      if(curretKeyboard && curretKeyboard.includes(node.message)){
        if(node.message == 'negate'){//es la forma alternativa del simbolo '!'
          const idx_negate = subStr.indexOf('!')
          const col_offset: number= idx_negate == -1? subStr.indexOf('not'): idx_negate
          const plotKeyboard =  plotter({
            ln: linea,
            col: columna + col_offset,
            len: idx_negate == -1? 3: 1,
          }, node.kind)
          return drop_reference(plotKeyboard)
        }
        const col = columna + subStr.indexOf(node.message)
        const plotKeyboard = plotter({ ln: linea, col: col, len: node.message.length }, node.kind)
        return drop_reference(plotKeyboard)
      }
      //if(keywords.Send.includes(node.message)) return null_case
      const col = columna + subStr.indexOf(node.message)
      return {
        result: plotter({ ln: linea, col: col, len: node.message.length }, 'Method'), //node.kind)
        references: undefined,
      }
    },
    Return: node => {
      return drop_reference(keyword_plotter(node, keywords[node.kind]))
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
        return null_case//plotter({ ln: linea, col: col, len: len }, 'Singleton')
      }

      const { linea, columna, subStr } = extraerLineaColumna(node, documentoStr)
      switch (tipo) {
        case 'number':
        case 'bigint':
          const valor_numerico = node.value.toString()
          return drop_reference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_numerico),
            len: valor_numerico.length,
          }, 'Literal_number'))
        case 'boolean':
          const valor_booleano = node.value.toString()
          return drop_reference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_booleano),
            len: valor_booleano.length,
          }, 'Literal_bool'))
        case 'string':
          const valor_string = node.value.toString()
          return drop_reference(plotter({
            ln: linea,
            col: columna + subStr.indexOf(valor_string) - 1,
            len: valor_string.length + 2,
          }, 'Literal_string'))
        default:
          return null_case
      }
    },
    Package: _ => null_case,
    Import:  _ => null_case,
    Program: _ => null_case,
    Body:    _ => null_case,
    Entity:  _ => null_case,
    Sentence:    _ => {
      return null_case
    },
    Expression:  _ => null_case,
    Catch: _ => null_case,
    Test:  _ => null_case,
    ParameterizedType: _ => {
      //console.log(node)
      return null_case
    },
    NamedArgument:    _ => null_case,

    Mixin:  _ => null_case,
    Describe: _ => null_case,

    Environment:  _ => null_case,
    Try: _ => null_case,
    Throw:    _ => null_case,

    If: node => {
      return drop_reference(keyword_plotter(node, keywords[node.kind]))
    },
    New: _ => {
      //return drop_reference(keyword_plotter(node, keywords[node.kind]))
      return null_case
    },
    Super: _ => {
      //console.log(node)
      return null_case
    },
  })
}

type NodeContext = {name: string, type: string}
type ProcesamientoCodigo = {
  result: NodePlotter[];
  references: NodeContext | NodeContext[];
}

export function processCode(node: Node, documentoStr: string[]): NodePlotter[] {
  return node.reduce((acum, node: Node) =>
  {
    const proc_nodo = procesar(node, documentoStr, acum.references)

    return {
      result: proc_nodo.result? acum.result.concat(proc_nodo.result):acum.result,
      references: acum.references.concat(proc_nodo.references || []),
    }
  }, { result:[], references: [] }).result
}
//return { result: [...acum.result, procesar(node, documentoStr), plotKeyboard], references: acum.references }
//return { result: [...acum.result, procesar(node, documentoStr), plotKeyboard], references: acum.references}

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
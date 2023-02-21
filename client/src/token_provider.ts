import { plotter, NodePlotter } from './highlighterDef'

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
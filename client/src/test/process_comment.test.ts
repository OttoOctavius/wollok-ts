import * as assert from 'assert'
import { processComments } from './../token_provider'
import { parse } from 'wollok-ts'
import * as vscode from 'vscode'
import { suite } from 'mocha'
import { plotter } from '../highlighterDef'
import { start } from 'repl'

const comentariosLineas = `// solo una linea
var f   = 1
var ff  = 2
var fff = 3 //codigo no se toma
//otra linea  //en la misma linea 
`

const comentariosMLineas = `/*codigo no se toma
var f   = 1 */
var ff  = 2
/*otra linea  */ var fff = 3  
`

/* Dado que los test dependen de archivos externos, se comprobara si
   la salida del highlighter se corresponde con el texto.
*/

function separarLineas(text: string) {
  return text.split('\n')
}

suite('Semantica wollok', function () {
  test('basico test', async function () {
    console.log('texto')
    const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosLineas)//docUri.toString())
    console.log(tp)
  })

  test('comentarios de una linea', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosLineas)
    /*
      const lineasSeparadas_ = separarLineas(comentariosLineas)

      const parsedFile = parse.File('_comentarios.wlk')
      const tp = parsedFile.tryParse(comentariosLineas)//docUri.toString())
    */
    const pcm = processComments(lineasSeparadas)
    pcm.forEach( comentario => {
      assert.equal(
        comentario.tokenType,
        'comment',
        'error en el tipo de token'
      )
      assert.equal(
        comentario.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const { line, character }  = comentario.range.start
      const largo = comentario.range.end.character-character
      const contenido = lineasSeparadas[line].substring(character)
      assert.ok(comentario.range.isSingleLine, 'debe ser de una sola linea');
      assert.ok(contenido.startsWith('//'), 'los comentarios de linea comienzan con //')
      assert.equal(contenido.length, largo, 'falla en el largo de la linea')
    })
  })

  test('comentarios multilinea linea', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosMLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosMLineas)

    const pcm = processComments(lineasSeparadas)
    let inicioComentario = true
    assert.equal( pcm.length>1, true, 'hay varios comentarios')
    pcm.forEach( comentario => {
      console.log(comentario)
      assert.equal(
        comentario.tokenType,
        'comment',
        'error en el tipo de token'
      )
      assert.equal(
        comentario.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = comentario.range.start
      const end  = comentario.range.end
      assert.ok(start.line<=end.line, 'el final del comentario esta despues del inicio')
      const largo = end.character-start.character
      const contenido_start = lineasSeparadas[start.line].substring(start.character)
      const contenido_end = lineasSeparadas[end.line].substring(end.character)
      //No es posible hacerlo multi linea, se separan en varios comentarios
      //assert.equal(comentario.range.isSingleLine, true, 'debe ser de una sola linea')
      if (inicioComentario){
        assert.ok(contenido_start.startsWith('/*'), 'los comentarios de linea comienzan con /*')
        inicioComentario = false
      }
      if (contenido_end.includes('*/')){
        assert.ok(contenido_end.endsWith('*/'), 'los comentarios de linea terminan con */')
        inicioComentario = true
        //assert.equal(contenido.length, largo, 'falla en el largo de la linea')
      }
    })
    assert.ok(inicioComentario, 'El ultimo comentario debe cerrarse al terminar el archivo')
  })
})
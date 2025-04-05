/* eslint-disable @typescript-eslint/no-unused-vars */
import * as assert from 'assert'
import { processComments, separateComments } from './../token_provider'
import { parse } from 'wollok-ts'
import { suite } from 'mocha'
//import { plotter } from '../highlighterDef'
import * as fs from 'fs'
import * as path from 'path'
import * as P from 'parsimmon'

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
    //const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosLineas)//docUri.toString())
  })

  test('comentarios de una linea', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    //const tp = parsedFile.tryParse(comentariosLineas)

    const absolutePath = path.resolve(path.join(__dirname, './testFixture/_comentarios.wlk'))
    const content = fs.readFileSync(absolutePath, 'utf-8') // Leer archivo como texto
    const tp = parsedFile.parse(content) // Usar Parsimmon para analizar el contenido

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
      assert.ok(comentario.range.isSingleLine, 'debe ser de una sola linea')
      assert.ok(contenido.startsWith('//'), 'los comentarios de linea comienzan con //')
      assert.equal(contenido.length, largo, 'falla en el largo de la linea')
    })
  })

  test('comentarios multilinea linea', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosMLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    //const tp = parsedFile.tryParse(comentariosMLineas)

    const pcm = processComments(lineasSeparadas).filter(x => x!==undefined)
    const pcm_linea = pcm.filter(node => node.rangeEnd === undefined)
    const pcm_multilinea = pcm.filter(node => node.rangeEnd !== undefined)

    pcm_linea.forEach( comentario => {
      //assert.fail('revienta antes del .start')
      if(comentario === undefined){
        assert.fail('no existen comentarios vacios')
      }
      if(comentario.range === undefined || comentario.rangeEnd === undefined){
        assert.fail(comentario.range === undefined?'primer rango vacio':'segundo rango vacio')
      }
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
      if ( comentario.range === undefined) return
      //assert.ok(comentario.range !== undefined, 'tiene algo el rango start')
      const start  = comentario.range.start
      const end  = comentario.range.end
      assert.ok(start.line<=end.line, 'el final del comentario esta despues del inicio')
      //const largo = end.character-start.character
      const contenido_start = lineasSeparadas[start.line].substring(start.character)
      //const contenido_end = lineasSeparadas[end.line].substring(end.character)
      //No es posible hacerlo multi linea, se separan en varios comentarios
      //assert.equal(comentario.range.isSingleLine, true, 'debe ser de una sola linea')

      //comentario linea
      assert.ok(contenido_start.startsWith('//'), 'un comentario de linea no puede tener mas de un rango')
    })

    pcm_multilinea.forEach( comentario => {
      //assert.fail('revienta antes del .start')
      if (comentario === undefined) {
        assert.fail('no existen comentarios vacios')
      }
      comentario.rangeEnd === undefined && assert.fail('segundo rango vacio')

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
      if (comentario.range === undefined) return
      //assert.ok(comentario.range !== undefined, 'tiene algo el rango start')
      const start = comentario.range.start
      const end = comentario.range.end
      end === undefined && assert.fail('este esta vacio')
      assert.ok(start.line <= end.line, 'el final del comentario esta despues del inicio')
      //const largo = end.character-start.character
      const contenido_start = lineasSeparadas[start.line].substring(start.character)
      //const contenido_end = lineasSeparadas[end.line].substring(end.character)
      //No es posible hacerlo multi linea, se separan en varios comentarios
      //assert.equal(comentario.range.isSingleLine, true, 'debe ser de una sola linea')

      assert.ok(contenido_start.startsWith('/*'), 'los comentarios de linea comienzan con /*')

      const contenido_end_index = comentario.rangeEnd.length > 0 ?
        comentario.rangeEnd[comentario.rangeEnd.length - 1]
        : comentario.range
      // TODO: falta expandir .rangeEnd en varios comentarios de linea
      /*
              assert.ok(contenido_end_index.start !== undefined, 'tiene algo el contenido_end_index start')
              assert.ok(contenido_end_index.start.line >= start.line, 'el final del comentario esta luego de la linea con /*')
              assert.ok(contenido_end_index.start.line == contenido_end_index.end.line, 'el contenido de la linea con *c/ esta en la misma linea')
      */
      assert.ok(contenido_end_index.end, undefined)
      const contenido_end = lineasSeparadas[contenido_end_index.end.line].substring(contenido_end_index.start.character, contenido_end_index.end.character)
      assert.ok(contenido_end.endsWith('*/'), 'los comentarios de linea terminan con */')
    })


  })
})
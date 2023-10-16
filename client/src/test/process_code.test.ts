import * as assert from 'assert'
import { getDocUri, activate } from './helper'
import { processCode, processComments } from '../token_provider'
import { parse } from 'wollok-ts'
import * as vscode from 'vscode'
import { suite } from 'mocha'
import { plotter } from '../highlighterDef'
import { start } from 'repl'
import { isNumberObject, isStringObject } from 'util/types'

const comentariosLineas = `// solo una linea
var f   = 1
var ff  = 'ff'
const fff = 3.0 //codigo no se toma
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

const esLiteral = (str: string) =>
  isNumberObject(str) ||
  isStringObject(str)

suite('Semantica wollok', function () {
/*
  const docUri = getDocUri('_comentarios.wlk')
  const docText = docUri.toString()
  const lineasSeparadas = separarLineas(docText)

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
*
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
      assert.ok(contenido_start.startsWith('/*'), 'los comentarios de linea comienzan con /*')
      assert.ok(contenido_end.endsWith('/'), 'los comentarios de linea terminan con /')
      //assert.equal(contenido.length, largo, 'falla en el largo de la linea')
    })
  })
*/
  test('variables y constantes', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    const f = parsedFile.parse('comentariosLineas')
    const tp = parsedFile.tryParse(comentariosLineas)

    const pcm = processCode(tp, lineasSeparadas)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      //console.log(simbolo)
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'const':
        case 'var':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token'
          )
          break
        //de momento la unica forma de probarlo es con los nombres de las variables
        case 'f':
        case 'ff':
        case 'fff':
          assert.equal(
            simbolo.tokenType,
            'variable',
            'error en el tipo de token'
          )
          break
        default:
          if(esLiteral(contenido)){
            isNumberObject(contenido) &&
            assert.equal(
              simbolo.tokenType,
              'literal',
              'error en el tipo de token'
            )
            isStringObject(contenido) &&
            assert.equal(
              simbolo.tokenType,
              'literal',
              'error en el tipo de token'
            )
          }
          break
      }
    })
  })

  test('clase vacia', async function () {
    const comentariosLineas = 'class Paloma{}'
    const lineasSeparadas = separarLineas(comentariosLineas)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosLineas)
    const pcm = processCode(tp, lineasSeparadas)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      console.log(simbolo)
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'class':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        //de momento la unica forma de probarlo es con los nombres de las variables
        case 'Paloma':
          assert.equal(
            simbolo.tokenType,
            'class',
            'error en el tipo de token de clase'
          )
          break
      }
    })
  })

  test('clase con propiedades y metodos vacios', async function () {
    const codigoClaseVacio = `
    class Nave{
      var conductor = 'Homero'

      method sube(alguien){
      }
      method baja(alguien){
      }
      method cantidadPasajeros() {
      }
      method chocar(){
      }
    }
    `

    const lineasSeparadas = separarLineas(codigoClaseVacio)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(codigoClaseVacio)
    const pcm = processCode(tp, lineasSeparadas)
      .filter(x => x !== undefined)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'class':
        case 'method':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case 'Nave':
          assert.equal(
            simbolo.tokenType,
            'class',
            'error en el tipo de token de clase'
          )
          break
        //variables
        case 'conductor':
        case 'pasajeros':
          assert.equal(
            simbolo.tokenType,
            'property',
            'error en el tipo de token de clase'
          )
          break
        case 'sube':
        case 'baja':
        case 'cantidadPasajeros':
        case 'chocar':
          assert.equal(
            simbolo.tokenType,
            'method',
            'error en el tipo de token de clase'
          )
          break
        case 'pasajero':
          assert.equal(
            simbolo.tokenType,
            'parameter',
            'error en el tipo de token de clase'
          )
          break
      }
    })
  })

  test('clase con propiedades y metodos', async function () {
    const codigoClaseCompl = `
    class Nave {
      var patente = "Star"
      //const pasajeros = []

      method sube(alguien){
        pasajeros.add(alguien)
      }
      method baja(alguien){
        pasajeros.remove(alguien)
      }
      method cantidadPasajeros() {
        return pasajeros.size()
      }
      method chocar() {
        pasajeros.clear()
      }
    }
    `

    const lineasSeparadas = separarLineas(codigoClaseCompl)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(codigoClaseCompl)
    const pcm = processCode(tp, lineasSeparadas)
      .filter(x => x !== undefined)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'class':
        case 'method':
        case 'return':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case 'Nave':
          assert.equal(
            simbolo.tokenType,
            'class',
            'error en el tipo de token de clase'
          )
          break
        //variables
        case 'conductor':
        case 'pasajeros':
          assert.equal(
            simbolo.tokenType,
            'property',
            'error en el tipo de token de clase'
          )
          break
        case 'sube':
        case 'baja':
        case 'cantidadPasajeros':
        case 'chocar':
          assert.equal(
            simbolo.tokenType,
            'method', //<--------------------------------deberia ser operador
            'error en el tipo de token de metodo'
          )
          break
        case 'pasajero':
          assert.equal(
            simbolo.tokenType,
            'parameter',
            'error en el tipo de token de parametro'
          )
          break
        case 'add':
        case 'remove':
        case 'size':
        case 'clear':
          assert.equal(
            simbolo.tokenType,
            'operator',
            'error en el tipo de token de metodos de los parametros'
          )
          break
      }
    })
  })

  test('herencia en clase', async function () {
    const codigoHerencia = `
      class Vehiculo {}
      class Tren inherits Vehiculo{}
      class TrenBala inherits Tren{}
      `
    const lineasSeparadas = separarLineas(codigoHerencia)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(codigoHerencia)
    const pcm = processCode(tp, lineasSeparadas)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      console.log(simbolo)
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'class':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case 'Vehiculo':
        case 'Tren':
        case 'TrenBala':
          assert.equal(
            simbolo.tokenType,
            'class',
            'error en el tipo de token de clase'
          )
          break
      }
    })
  })

  test('objeto vacio', async function () {
    const comentariosLineas = 'object Pepita{}'
    const lineasSeparadas = separarLineas(comentariosLineas)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(comentariosLineas)
    const pcm = processCode(tp, lineasSeparadas)
    pcm.forEach( simbolo => {
      assert.equal(
        simbolo.tokenModifiers[0],
        'declaration',
        'error del modificador del token'
      )
      const start  = simbolo.range.start
      const end  = simbolo.range.end
      assert.ok(start.line==end.line, 'token esta en la misma linea')
      console.log(simbolo)
      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'object':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        //de momento la unica forma de probarlo es con los nombres de las variables
        case 'Pepita':
          assert.equal(
            simbolo.tokenType,
            'object',
            'error en el tipo de token de clase'
          )
          break
      }
    })
  })

})

async function compararUriConResultadoToken(
  docUri: vscode.Uri,
  //position: vscode.Position,
  expectedCompletionList: Record<string, string> //vscode.CompletionList
) {
  await activate(docUri)

  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await vscode.commands.executeCommand(
    //@command:editor.action.inspectTMScopes
    //estaba vscode.executeCompletionItemProvider
    //'vscode.editor.action.inspectTMScopes',
    'vscode.editor.action.inspect',
    docUri
  )) // as vscode.CompletionList
  assert.ok(actualCompletionList !== undefined)
/*
  assert.ok(actualCompletionList.items.length >= 2)
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i]
    assert.equal(actualItem.label, expectedItem.label)
    assert.equal(actualItem.kind, expectedItem.kind)
  })*/
}
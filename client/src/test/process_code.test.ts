import * as assert from 'assert'
import { processCode } from '../token_provider'
import { parse } from 'wollok-ts'
import * as vscode from 'vscode'
import { suite } from 'mocha'
import { isNumberObject, isStringObject } from 'util/types'

const comentariosLineas = `// solo una linea
var f   = 1
var ff  = 'ff'
const fff = 3.0 //codigo no se toma
//otra linea  //en la misma linea 
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
*/
  test('variables y constantes', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const lineasSeparadas = separarLineas(comentariosLineas)

    const parsedFile = parse.File('_comentarios.wlk')
    //const f = parsedFile.parse('comentariosLineas')
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

      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'class':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
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
  test('clase con propiedades', async function () {
    const codigoClasePropiedades = `class Nave{
      var conductor = 'Homero'
      const tamanio = 100
    }
    `

    const lineasSeparadas = separarLineas(codigoClasePropiedades)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(codigoClasePropiedades)
    const pcm = processCode(tp, lineasSeparadas).filter(x => x !== undefined)

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
        case 'var':
        case 'const':
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
        case 'tamanio':
          assert.equal(
            simbolo.tokenType,
            'property',
            'error en el tipo de token de clase'
          )
          break
        case '\'Homero\'':
          assert.equal(
            simbolo.tokenType,
            'string',
            'error en el tipo de token de clase'
          )
          break
        case '100':
          assert.equal(
            simbolo.tokenType,
            'number',
            'error en el tipo de token de clase'
          )
          break
        default:
          assert.fail(`caso no testeado: ${contenido}: ${simbolo.tokenType} (${start.character},${end.character})}`)
      }
    })
  })

  test('clase con metodos vacios', async function () {
    const codigoClaseVacio = `class Nave{
      method sube(alguien){
      }
      method baja(pasajero){
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
        case 'alguien':
        case 'pasajero':
          assert.equal(
            simbolo.tokenType,
            'parameter',
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
        default:
          assert.fail(`caso no testeado: ${contenido}: ${simbolo.tokenType} (${start.character},${end.character})}`)
      }
    })
  })

  test('clase con propiedades y metodos', async function () {
    const codigoClaseCompl = `class Nave {
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
      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
      switch (contenido) {
        case 'class':
        case 'method':
        case 'return':
        case 'var':
        case '=':
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
        case '"Star"':
          assert.equal(
            simbolo.tokenType,
            'string',
            'error en el tipo de token de clase'
          )
          break
        case 'conductor':
        case 'patente':
        //case 'pasajeros':
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
            'error en el tipo de token de metodo'
          )
          break
        case 'pasajero':
        case 'alguien':
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
            'method',
            'error en el tipo de token de metodos de los parametros'
          )
          break
        case 'const':
          assert.fail('const esta comentado.')
          break
        default:
          // hay otro caso con property..?
          assert.fail('No debe haber extras, ' + contenido + ' , largo' + contenido.length)
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

      const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
      switch (contenido) {
        case 'object':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case 'Pepita':
          assert.equal(
            simbolo.tokenType,
            'object',
            'error en el tipo de token de clase'
          )
          break
      }
    })
    test('test archivo', async function () {
      //const contenido =  extraerContenidoArchivo('../testFixture/_comentarios.wlk')

    })

    test('test de test vacios', async function () {
      const codigoTest = `
describe "Tests" {
        test "test1" {}
        test "test2" {        }
        test "test3" {

        }
}`
      const lineasSeparadas = separarLineas(codigoTest)
      const parsedFile = parse.File('_testeo.wlk')
      const tp = parsedFile.tryParse(codigoTest)
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

        const contenido = lineasSeparadas[start.line].substring(start.character, end.character)
        switch (contenido) {
          case 'describe':
          case 'test':
            assert.equal(
              simbolo.tokenType,
              'keyword',
              'error en el tipo de token keyword'
            )
            break
          case 'Test':
          case 'test1':
          case 'test2':
          case 'test3':
            assert.equal(
              simbolo.tokenType,
              'string',
              'error en el tipo de token de clase'
            )
            break
          default:
            assert.fail('No debe haber extras, ' + contenido + ' , largo' + contenido.length)
        }
      })
    })
  })


  function extraerLinea(lineasSeparadas: string[], range: vscode.Range) {
    return lineasSeparadas[range.start.line].substring(range.start.character, range.end.character)
  }
})
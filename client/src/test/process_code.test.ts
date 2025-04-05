import * as assert from 'assert'
import { processCode } from '../token_provider'
import { parse } from 'wollok-ts'
import * as vscode from 'vscode'
import { suite } from 'mocha'
import { isNumberObject, isStringObject } from 'util/types'

const comentariosLineas = `// solo una linea
var v   = 1
var va  = 'ff'
const con = 3.0 //codigo no se toma
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
      switch (contenido) {
        case 'const':
        case 'var':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token'
          )
          break
        case 'v':
        case 'va':
        case 'con':
          assert.equal(
            simbolo.tokenType,
            'variable',
            'error en el tipo de token'
          )
          //Se comprueba que no coincida con los keywords, chequeando si empiezan luego de pos. 1
          assert.equal(
            start.character>2, //la cantidad minima de caracteres entre 'var' y 'const' es 3
            true,
            'el nombre de las variables se esta extrayendo del keyword, generando una colision'
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

  test('literales booleanos', async function () {
    //const parsedFile = parse.File(docUri.path)
    //const tp = parsedFile.tryParse(docUri.toString())
    const codigoLiteralesBooleanos = `
const esTrue = true
const esFalse = !esTrue
const seraFalse = esTrue and esFalse
const seraTrue = esTrue or esFalse

const a = true and true

const b = not false
const c = (true and false) or (not false)
const d = (true && false)  || (!false)
`
    const lineasSeparadas = separarLineas(codigoLiteralesBooleanos)
    const parsedFile = parse.File('_comentarios.wlk')
    const tp = parsedFile.tryParse(codigoLiteralesBooleanos)

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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
      switch (contenido) {
        case 'const':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token'
          )
          break
        case 'true':
        case 'false':
          assert.equal(simbolo.tokenType, 'keyword', 'error en el tipo de token booleano') //TODO comprobar tipo bools
          break
        case 'and':
        case '&&':
        case 'or':
        case '||':
        case 'not':
        case '!':
          assert.equal(
            simbolo.tokenType,
            'operator',
            'error en el tipo de token operador'
          )
          break
        //de momento la unica forma de probarlo es con los nombres de las variables
        case 'esTrue':
        case 'esFalse':
        case 'seraTrue':
        case 'seraFalse':
        case 'a':
        case 'b':
        case 'c':
        case 'd':
          assert.equal(
            simbolo.tokenType,
            'variable',
            'error en el tipo de token de las constantes'
          )
          break
        default:
          assert.fail('No debe haber extras, ' + contenido + ' , largo' + contenido.length)
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
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
      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
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
  })


  test('package, program e import, vacios', async function () {
    const codigoTest = `
import definiciones.*
            
/*package*/package helloWorld {
program helloWorld2 {
    //console.println("Hola mundo")
  }
}`
    const lineasSeparadas = separarLineas(codigoTest)
    const parsedFile = parse.File('rgg.wlk')
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
      if(contenido.includes('/*') || contenido.includes('*/') )
        assert.fail('Se incorporo un fragmento de comentario en la salida')

      assert_tieneEspaciosExtra(contenido)
      switch (contenido) {
        case 'import':
        case 'package':
        case 'program':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case 's':
          assert.equal(
            simbolo.tokenType,
            'string',
            'error en el tipo de token de string'
          )
          break
        case 'definiciones':
        case 'helloWorld':
        case 'helloWorld2':
          assert.equal(
            simbolo.tokenType,
            'property',
            'error en el tipo de token programa/package'
          )
          break
        default:
          assert.fail('No debe haber extras, ' + contenido + ' , largo' + contenido.length)
      }
    })
  })

  test('describe y tests vacios', async function () {
    const codigoTest = `
describe "Tests" {
      test "test1" {}
      test "test2" {        }
      test "test3" {        }
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

      const contenido = extraerLinea(lineasSeparadas, simbolo.range)
      assert_tieneEspaciosExtra(contenido)

      switch (contenido) {
        case 'describe':
        case 'test':
          assert.equal(
            simbolo.tokenType,
            'keyword',
            'error en el tipo de token keyword'
          )
          break
        case '"Tests"':
          assert.equal(
            simbolo.tokenType,
            'property', //'string',
            'error en el tipo de token de property' //string'
            //TODO: revisar porque no son strings
          )
          break
        case '"test1"':
        case '"test2"':
        case '"test3"':
          assert.equal(
            simbolo.tokenType,
            'function',
            'error en el tipo de token de funcion'
            //TODO: revisar porque no son strings
          )
          break
        default:
          assert.fail('No debe haber extras, ' + contenido + ' , largo' + contenido.length)
      }
    })
  })

  function extraerLinea(lineasSeparadas: string[], range: vscode.Range) {
    return lineasSeparadas[range.start.line].substring(range.start.character, range.end.character)
  }
  function assert_tieneEspaciosExtra(contenido: string) {
    if(contenido[0] == ' ' || contenido[contenido.length-1]==' ')
      assert.fail('el contenido incluyo espacios vacios invalidos')
  }
})
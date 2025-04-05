///esModuleIn
import * as vscode from 'vscode'
import { parse } from 'wollok-ts'
import * as def from './highlighterDef'
import { processCode, processComments } from './token_provider'

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

    const lineasSeparadas = separarLineas(docText)
    const pcd = processCode(tp.members[0], lineasSeparadas)
    let pcm = processComments(lineasSeparadas)
    /*
    pcm = pcm.reduce((node: def.NodePlotterComentary) => {
      return node.rangeEnd === undefined? node :
        [...node.rangeEnd.map(x => { return{ ...node, range:x }}), node]
    }, [])*/
    {
      const nodosSimples = pcm.filter((node: def.NodePlotterComentary) => node.rangeEnd === undefined)
      const nodosMultiples: def.NodePlotter[] = pcm
        .filter((node: def.NodePlotterComentary) => node.rangeEnd !== undefined)
        .map(node =>
          [node.range].concat(node.rangeEnd).map(x => {
            return{ range:x, tokenType: node.tokenType, tokenModifiers:node.tokenModifiers }}
          )
        ).flat()
      pcm = nodosSimples.concat(nodosMultiples)
    }
    const processed = []
      .concat(pcd)
      .concat(pcm)
      .filter(x => x !== undefined)

    processed.forEach((x: def.NodePlotter) =>
      tokensBuilder.push(x.range, x.tokenType, x.tokenModifiers)
    )

    return tokensBuilder.build()
  },
}

export const legend = new vscode.SemanticTokensLegend(def.tokenTypes, def.tokenModifiers)
export const selector = { language: 'wollok', scheme: 'file' }
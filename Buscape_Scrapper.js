const fs = require('fs'); //Biblioteca padrão para arquivos de sistema
const puppeteer = require('puppeteer'); //API do NodeJS que usa o Chomium Headless para fazer suas operações

// Endereço do site Buscapé, onde será feito a captura dos dados dos produtos listados
// Tal endereço é de uma pesquisa por SmartPhones feita no site. Esse mesmo padrão de URL deve ser seguido, para a captura correta de informações
const url = "https://www.buscape.com.br/search?q=SmartPhone&no-shortcut=1"

// Função usada para escrita de um arquivo em CSV na mesma pasta do script
// ATENÇÃO: Essa função irá sobrescrever qualquer arquivo com o nome "OUTPUT.csv" existente sem perguntar
function write_csv_file(header, rows, separator=";", newline="\r\n")
{
    // Iniciando a lista, que terá o cabeçalho e as linhas que serão escritas no arquivo
    let file_data = []

    // Cabeçalho é adicionado a lista uma única vez, com o separador e a nova linha
    file_data.push(header.join(separator) + newline)

    // Loop que irá adicionar as linhas a lista
    for (let index = 0; index < rows.length; index++)
    {
        file_data.push(rows[index].join(separator) + newline)
    }

    // Essa linha fará com que a lista, antes separadas por várias strings, torne-se somente uma, pronta para escrita no arquivo
    const write_data = file_data.join("")

    // Biblioteca FS, que fará o resto do serviço, cabendo apenas dar o nome ao arquivo, passar a variável da lista e determinar a função que retorna informações em caso de sucesso e erro
    fs.writeFile("OUTPUT.csv", write_data, function(error)
    {
        if (error === null)
        {
            console.log("O Arquivo Foi Salvo Corretamente!")    
        }
        else
        {
            console.error("Ocorreram Erros ao Salvar o Arquivo: " + error)
        }
    })
}

// Função que tem o objetivo de transformar uma lista de objeto em lista de listas
// Essa função tem como propósito auxiliar a função "write_csv_file"
function objectList_to_arrayList(objectList)
{
    let arrayList = [] // Criação da lista de listas

    // Loop que irá percorrer os objetos dentro da lista passada
    for (let index = 0; index < objectList.length; index++)
    {
        let object_keys = [] // Criação e limpeza de uma lista auxiliar para inserção dos elementos do objeto na sublista

        // Loop que irá percorrer os elementos do objeto
        for (let [key, value] of Object.entries(objectList[index]))
        {
            object_keys.push(value) // É feita a inserção somente do valor do objeto, desprezando-se a chave
        }

        arrayList.push(object_keys) // Inserção da sublista na lista principal "arrayList"
    }

    return arrayList // Retorno da lista de listas
}

// Função assíncrona que irá capturar os dados dos produtos da pesquisa no Buscapé
async function capture_html(website)
{
    // Instanciamento do Browser
    const browser = await puppeteer.launch()

    const page = await browser.newPage()
    await page.goto(website) // Ir para a página
    await page.waitFor(2000) // Esperar dois segundos

    // Função que irá capturar os dados e colocá-los em um objeto
    const products_array = await page.evaluate(function()
    {
        // Função que irá criar um "Array", e irá percorrer todos os elementos compatíveis com o seletor ".card--prod"
        return Array.from(document.querySelectorAll(".card--prod"), function(element)
        {
            // Captura dos dados do produto. A captura é feita dos elementos do HTML/DOM
            let product_id = element.getAttribute("data-id")
            let product_link = "https://www.buscape.com.br" + element.querySelector("a.name").getAttribute("href")
            let product_name = element.querySelector("a.name").getAttribute("title")
            let product_price = element.querySelector("span.mainValue").innerText

            // Instanciamento do objeto com os dados dos produtos
            let product_object = 
            {
                id: product_id,
                link: product_link,
                name: product_name,
                price: product_price
            }

            // Retorno do objeto
            return product_object
        })
    })

    // criação do cabeçalho e linhas do documento CSV
    const file_header = ["id", "link", "name", "price"]
    const file_rows = objectList_to_arrayList(products_array)

    write_csv_file(file_header, file_rows) // Função de criação de arquivo CSV

    await browser.close() // Encerramento do Browser  
}

capture_html(url)
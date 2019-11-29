var path = require('path');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
process.env['PATH'] = path.join(__dirname, '/instantclient') + ';' + process.env['PATH'];
var oracledb = require('oracledb')

//definindo servidor
const host = 'localhost'
const port = 4000

//configurando o body parser para pegar POSTS mais tarde
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//definindo as rotas
const router = express.Router()
router.get('/', (req, res) => res.json({ message: 'Funcionando!' }))
app.use('/', router)

// Consulta nota fiscal pelo código de faturamento
router.get('/api/v1.0/faturamento/consultaNfe/codfat/:id', (req, res) => {
    let filter = '';
    if (req.params.id) filter = 'WHERE CODFAT=' + parseInt(req.params.id);
    execSQLQuery('SELECT DATA, STATUS, CODFAT, NRODOC_FISCAL, NUMRECEBIMENTO, MOTIVO, CHAVE, CODCONTIGENCIA '
        + 'FROM DBFAT_NFE '
        + filter, res);
})

// Consulta nota fiscal por ID
router.get('/api/v1.0/faturamento/consultaNfe/notafiscal/:id', (req, res) => {
    let filter = '';
    if (req.params.id) filter = 'WHERE NRODOC_FISCAL=' + parseInt(req.params.id);
    execSQLQuery('SELECT DATA, STATUS, CODFAT, NRODOC_FISCAL, NUMRECEBIMENTO, MOTIVO, CHAVE, CODCONTIGENCIA '
        + 'FROM DBFAT_NFE '
        + filter, res);
})

// Consulta status da nota pelo ID
router.get('/api/v1.0/faturamento/consultaNfe/status/:id', (req, res) => {
    let filter = '';
    if (req.params.id) filter = "WHERE STATUS='" + req.params.id + "'";
    execSQLQuery('SELECT DATA, STATUS, CODFAT, NRODOC_FISCAL, NUMRECEBIMENTO, MOTIVO, CHAVE, CODCONTIGENCIA '
        + 'FROM DBFAT_NFE '
        + filter + ' AND ROWNUM <=5', res);
})

// Subindo o serviço da API para consumo
app.listen(port, host, () => {
    console.log(`Servidor rodando em http://${host}:${port}/api/v1.0/faturamento/consultaNfe/codfat/`)
    console.log('Para derrubar o servidor: ctrl + c');
})

// Função que gera a conexão e consulta no banco de dados ORACLE
async function execSQLQuery(sqlQry, res) {
    let connection;
    // console.log(sqlQry)
    try {
        connection = await oracledb.getConnection({
            user: "usuariodobanco",
            password: "12345678",
            connectString: "192.168.0.0"
        });

        const result = await connection.execute(sqlQry);

        var campo = result.metaData;
        var linha = result.rows;
        var ticket = { listaNFE: [] };
        function replacer(object) {
            for (let i = 0; i < object.length; i++) {
                if (campo[i].name == "DATA") {
                    data = {};
                    //Verifico se o name é igual ao argumento inicial do período.
                    //Se sim, atribuo um objeto vazio.
                }
                // console.log(data[campo[i].name] = object[i]);
                data[campo[i].name] = object[i];
                //Atribuo os dados equivalentes.
                if (campo[i].name == "CODCONTIGENCIA") {
                    ticket.listaNFE.push(data);
                    //Verifico se o name é igual ao argumento final do período.
                    //Se sim, adiciono o objeto de dados ao array de eventos.
                }
            }
        }

        for (let e = 0; e < linha.length; e++) {
            // console.log(e, " >> ", linha[e]);
            replacer(linha[e]);
        }
        res.json(ticket); //Retorno dos dados no formato JSON

    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }

}
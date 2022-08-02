var apiKey: string | null;
let requestToken: string;
let username: string;
let password: string;
let sessionId: string | null;
let listId: string | null;
let logged: boolean = false;

let criarListaNome: string;
let criarListaDescricao: string;

let loginButton = document.getElementById('login-button') as HTMLButtonElement;
let searchButton = document.getElementById('search-button') as HTMLButtonElement;
let criarListaButton = document.getElementById('criar-lista-button') as HTMLButtonElement;

let searchContainer = document.getElementById('search-container') as HTMLDivElement;
let loginContainer = document.getElementById('login-container') as HTMLDivElement;
let listCreateContainer = document.getElementById('list-create-container') as HTMLDivElement;
let listContainer = document.getElementById('list-container') as HTMLDivElement;

const INVISIBLE:string = "visually-hidden";

interface movie {
  adult: boolean,
  backdrop_path: string,
  genre_ids: number[],
  id: number,
  original_language: string,
  original_title: string,
  overview: string,
  popularity: number,
  poster_path: string,
  release_date: string,
  title: string,
  video: boolean,
  vote_average: number,
  vote_count: number
}

interface query {
  page: number,
  results: movie[],
  total_pages: number,
  total_results: number
}

interface list {
  created_by: string,
  description: string,
  favorite_count: number,
  id: number,
  items: movie[]
  item_count: number,
  iso_639_1: string,
  name: string,
  poster_path: string
}

interface token {
  success: boolean,
  expires_at: string,
  request_token: string
}

interface httpGet {
  url: string;
  method: string;
  body?: string | object | null
}

class HttpClient {
  static async get({url, method, body = null}: httpGet): Promise<any> {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open(method, url, true);

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject({
            status: request.status,
            statusText: request.statusText
          })
        }
      }
      request.onerror = () => {
        reject({
          status: request.status,
          statusText: request.statusText
        })
      }

      if (body) {
        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        body = JSON.stringify(body);
      }
      request.send(body);
    })
  }
}

loginButton.addEventListener('click', async () => {
  await criarRequestToken();
  await logar();
  await criarSessao();
})

searchButton.addEventListener('click', async () => {
  let lista = document.getElementById("lista");
  if (lista) {
    lista.outerHTML = "";
  }
  let query: string = ((<HTMLInputElement>document.getElementById('search')).value);
  let listagemDeFilmes = await procurarFilme(query);
  let ul = document.createElement('ul');
  ul.id = "lista"
  for (const item of listagemDeFilmes.results) {
    let li = document.createElement('li');
    let link = document.createElement('button');
    link.type = "button";
    link.classList.add("btn","btn-primary","btn-sm");
    link.addEventListener('click', () => adicionarFilmeNaLista(item.id, parseInt(listId?listId:'1')))
    link.appendChild(document.createTextNode("+ Lista"));
    li.appendChild(document.createTextNode(item.original_title));
    li.appendChild(document.createTextNode(" - "));
    li.appendChild(link);
    li.classList.add("my-1");
    ul.appendChild(li)
  }
  searchContainer.appendChild(ul);
})

criarListaButton.addEventListener('click', async () => {
  await criarLista(criarListaNome, criarListaDescricao);
})

function preencherSenha(): void {
  password = (<HTMLInputElement>document.getElementById('senha')).value;
  validateLoginButton();
}

function preencherLogin(): void {
  username =  (<HTMLInputElement>document.getElementById('login')).value;
  validateLoginButton();
}

function preencherApi(): void {
  apiKey = (<HTMLInputElement>document.getElementById('api-key')).value;
  validateLoginButton();
}

function validateLoginButton(): void {
  if (password && username && apiKey) {
    loginButton.disabled = false;
  } else {
    loginButton.disabled = true;
  }
}

async function criarRequestToken(): Promise<void> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
    method: "GET"
  })
  requestToken = result.request_token;
}

async function logar(): Promise<void> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
    method: "POST",
    body: {
      username: `${username}`,
      password: `${password}`,
      request_token: `${requestToken}`
    }
  });
  requestToken = result.request_token;
  carregar();
}

async function criarSessao(): Promise<void> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
    method: "GET"
  })
  sessionId = result.session_id;
  localStorage.setItem("TMDBapiKey", apiKey ? apiKey : ""); 
  localStorage.setItem("TMDBsessionId", sessionId ? sessionId : "");
  if (sessionId) {
    searchButton.disabled = false;
  }
}

async function procurarFilme(query: string): Promise<query> {
  query = encodeURI(query)
  let result:query = await HttpClient.get({
    url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
    method: "GET"
  })
  return result
}

async function adicionarFilme(filmeId: number): Promise<void> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
    method: "GET"
  })
  console.log(result);
}

function preencherNomeLista() {
  criarListaNome = (<HTMLInputElement>document.getElementById('criar-lista-nome')).value;
  validateListCreateButton();
}

function preencherDescricaoLista() {
  criarListaDescricao = (<HTMLInputElement>document.getElementById('criar-lista-descricao')).value;
  validateListCreateButton();
}

function validateListCreateButton(){
  if (criarListaNome && criarListaDescricao) {
    criarListaButton.disabled = false;
  } else {
    criarListaButton.disabled = true;
  }
}

async function criarLista(nomeDaLista: string, descricao: string): Promise<void> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      name: nomeDaLista,
      description: descricao,
      language: "pt-br"
    }
  })
  listId = result.list_id;
  localStorage.setItem("TMDBlistId", listId ? listId : ""); 
  carregar();
}

async function adicionarFilmeNaLista(filmeId: number, listaId: number): Promise<void|any> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      media_id: filmeId
    }
  })
  carregar();
}

async function pegarLista(): Promise<list> {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
    method: "GET"
  })
  return result
}

async function montarLista(): Promise<void> {
  let listBody = document.getElementById('list-body') as HTMLDivElement;
  if (listBody) {
    listBody.innerHTML = "";
  }
  let listaDeFilmes = await pegarLista();
  let title = document.createElement('div');
  title.id = "lista-filmes-title";
  let nomeLista = document.createElement('h5');
  nomeLista.appendChild(document.createTextNode(listaDeFilmes.name));
  title.appendChild(nomeLista);
  let descricaoLista = document.createElement('h6');
  descricaoLista.appendChild(document.createTextNode(listaDeFilmes.description));
  title.appendChild(descricaoLista);
  listBody.appendChild(title);
  let ul = document.createElement('ul');
  ul.id = "lista-filmes";
  for (const filme of listaDeFilmes.items) {
    let li = document.createElement('li');
    li.appendChild(document.createTextNode(filme.original_title));
    ul.appendChild(li);
  }
  listBody.appendChild(ul);
}

function carregar(): void {
  sessionId = localStorage.getItem("TMDBsessionId");
  apiKey = localStorage.getItem("TMDBapiKey");
  if (sessionId && apiKey) {
    loginContainer.classList.add(INVISIBLE);
  } else {
    loginContainer.classList.remove(INVISIBLE);
  }

  listId = localStorage.getItem("TMDBlistId");
  if (listId) {
    montarLista();
    listCreateContainer.classList.add(INVISIBLE);
    searchContainer.classList.remove(INVISIBLE);
    listContainer.classList.remove(INVISIBLE);
  } else {
    listCreateContainer.classList.remove(INVISIBLE);
    searchContainer.classList.add(INVISIBLE);
    listContainer.classList.add(INVISIBLE);
  }
}

{/*
PÁGINA HTML PARA UTILIZAR O COM O DESAFIO 4

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossorigin="anonymous">
    <title>Desafio 4</title>
    <script src="dist/app.js" defer></script>
</head>
<body onload="carregar()">
    <section id="desafio4">
        <nav class="navbar navbar-expand-lg bg-light">
            <div class="container-fluid">
              <a class="navbar-brand" href="#">Desafio 4 - Dados de filme do TMDB</a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div class="navbar-nav">
                  <a class="nav-link active" aria-current="page" href="#">Home</a>
                </div>
              </div>
            </div>
        </nav>
        <div class="container">
            <div class="card mt-3" id="login-container">
                <div class="card-header">
                    <h5 class="card-title">Login</h5>
                </div>
                <div class="card-body">
                    <input class="form-control mt-2" id="login" placeholder="Login" onchange="preencherLogin()">
                    <input class="form-control mt-2" id="senha" placeholder="Senha" type="password" onchange="preencherSenha()">
                    <input class="form-control mt-2" id="api-key" placeholder="Api Key" onchange="preencherApi()">
                    <button type="button" class="btn btn-primary mt-2" id="login-button" disabled>Login</button>
                </div>
            </div>

            <div class="card mt-3" id="list-create-container" class="visually-hidden">
                <div class="card-header">
                    <h5 class="card-title">Criar Lista de Filmes</h5>
                </div>
                <div class="card-body">
                    <input class="form-control mt-2" id="criar-lista-nome" placeholder="Nome da Lista" onchange="preencherNomeLista()">
                    <input class="form-control mt-2" id="criar-lista-descricao" placeholder="Descrição da Lista"                    onchange="preencherDescricaoLista()">
                    <button type="button" class="btn btn-primary mt-2" id="criar-lista-button" disabled>Criar Lista</button>
                </div>
            </div>

            <div class="card mt-3" id="search-container" class="visually-hidden">
                <div class="card-header">
                    <h5 class="card-title">Pesquisar Filme</h5>
                </div>
                <div class="card-body">
                    <input class="form-control mt-2" id="search" placeholder="Escreva...">
                    <button type="button" class="btn btn-primary mt-2" id="search-button">Pesquisar Filme</button>
                </div>
            </div>

            <div class="card mt-3" id="list-container" class="visually-hidden">
                <div class="card-header">
                    <h5 class="card-title">Minha Lista de Filmes</h5>
                </div>
                <div class="card-body" id="list-body">

                </div>
            </div>
        </div>
    </section>

    <!-- Bootstrap JavaScript Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-pprn3073KE6tl6bjs2QrFaJGz5/SUsLqktiwsUTF55Jfv3qYSDhgCecCxMW52nD2" crossorigin="anonymous"></script>
</body>
</html>
*/}
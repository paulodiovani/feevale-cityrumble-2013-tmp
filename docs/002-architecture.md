# Database

    
## Lista de objetos

### Usuários

Tabela de usuários.

Possivelmente este objeto terá associações por perfis, como seu perfil em redes sociais (Facebook, Foursquare, etc.). Por hora vamos deixar bem simples.

Inclui lista (`array`) de deficiências (_Ex: cegueira, baixa visão, cadeirante, etc._).

| users          |
| -------------- |
| username       |
| name           |
| email          |
| disabilities[] |


### Locais

Tabela de locais, contendo o endereço e outros dados.

Inclui lista de categorias do local (_Ex: restaurantes, casas noturnas, estacionamentos_).

Inclui lista de opções para deficientes disponíveis no local (veja abaixo), o que será, 
provavelmente, o mais importante da aplicação, pois dará mais _peso_ aos locais, 
dependendo do perfil do usuário e sua(s) deficiência(s).

| places                     |
| -------------------------- |
| foursquare_id              |
| name                       |
| contact                    |
| location                   |
| categories[]               |
| disabilities_options[]     |


### Categories de locais

Tabela de categorias.

| categories                 |
| -------------------------- |
| foursquare_id              |
| name                       |
| icon                       |
| categories[]               |

### Opções para deficientes

Tabela que lista as opções disponíveis para deficientes nos locais.

_Ex: Banheiro adaptado, piso tátil, etc._

Inclui o tipo de deficiência (_Ex: cegueira, baixa visão, cadeirante, etc._).

| disabilities_options |
| -------------------- |
| disability           |
| description          |


### Pesquisas do usuário

Tabela com as últimas pesquisas realizadas pelo usuário.

Tem por finalidade manter um cache para evitar requisições repetidas aos serviços do foursquare.

* O campo `type` especifica o tipo de pesquisa, se por categoria ou local.
* O campo `category_id` especifica a categoria usada na pesquisa, se for uma pesquisa por local (ou por sub-categoria).
* O campo `timespamp` determina por quanto tempo a pesquisa é válida antes de ser sobrescrita (não deve ser mais do que 1 ou 2 minutos).
* O campo `results` guarda um array com os resultados da pesquisa, contendo neste o objeto encontrado e o peso dele na pesquisa.

| user_searches |                     |
| ------------- | ------------------- |
| username      |                     |
| type          |                     |
| category_id   |                     |
| ll            |                     |
| timestamp     |                     |
| results[]     | (category or place) |
|               | distance            |
|               | weight              |
# Database

> Sugestão: Utilizar NoSQL, possivelente Amazon DynamoDB
>
> _Obs: acredito que a estrutura apresentada a seguir é pouco útil para NoSQL, especialmente para DynamoDB, que utiliza um máximo de duas chaves. Dessa forma, o modelo de dados deverá ser repensado.
    
## Lista de objetos

### Usuários

Objeto de usuário.

Possivelmente este objeto terá associações por perfis, como seu perfil em redes sociais (Facebook, Foursquare, etc.). Por hora vamos deixar bem simples.

| user  |
| ----- |
| id    |
| name  |
| email |

### Categorias

Objeto de categorias, para listar as categorias de locais.

_Ex: restaurantes, casas noturnas, estacionamentos_

| categories |
| ---------- |
| id         |
| parent_id  |
| name       |

### Locais

Objeto de locais, contendo o endereço e outros dados.

| places  |
| ------- |
| id      |
| name    |
| address |

### Locais por categoria

Associação n/n entre locais e suas categorias.

| place_categories |
| ---------------- |
| id               |
| category_id      |
| place_id         |

### Deficiências

Objeto de deficiências.

Será responsável por classificar as opções para deficientes dos locais.

_Ex: cegueira, baixa visão, cadeirante, etc._

| disabilities |
| ------------ |
| id           |
| description  |

### Opções para deficientes

Objeto que lista as opções disponíveis para deficientes nos locais.

_Ex: Banheiro adaptado, piso tátil, etc._

| disabilities_options |
| -------------------- |
| id                   |
| disability_id        |
| description          |

### Opções em locais

Opções para deficientes disponíveis nos locais visitados.

Este objeto será, provavelmente, o mais importante da aplicação. O qual dará mais _peso_ aos locais, dependendo do perfil do usuário e sua(s) deficiência(s).

| local_options |
| ------------- |
| id            |
| local_id      |
| option_id     |

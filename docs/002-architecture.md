# Database

    
## Lista de objetos

### Usuários

Tabela de usuários.

Possivelmente este objeto terá associações por perfis, como seu perfil em redes sociais (Facebook, Foursquare, etc.). Por hora vamos deixar bem simples.

Inclui lista (`array`) de deficiências (_Ex: cegueira, baixa visão, cadeirante, etc._).

| user           |
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
| name                       |
| address                    |
| categories[]               |
| disabilities_options_ids[] |


### Opções para deficientes

Tabela que lista as opções disponíveis para deficientes nos locais.

_Ex: Banheiro adaptado, piso tátil, etc._

Inclui o tipo de deficiência (_Ex: cegueira, baixa visão, cadeirante, etc._).

| disabilities_options |
| -------------------- |
| disability           |
| id                   |
| description          |



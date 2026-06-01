# Álbum Copa 2026 - MVP v1.5

Versão com base por seleções da Copa do Mundo 2026.

## O que mudou na v1.5

- Base inicial substituída por 48 seleções.
- Cada seleção possui 20 figurinhas.
- Total inicial: 960 figurinhas.
- Códigos no formato informado:
  - Brasil: BRA-1 até BRA-20
  - Argentina: ARG-1 até ARG-20
  - África do Sul: RSA-1 até RSA-20
- Nova aba **Seleções**.
- Cards por seleção agrupados por Grupo A até Grupo L.
- Atalho da seleção para Checklist.
- Atalho da seleção para Scanner.
- Página do scanner passa a representar a seleção na ordem da base.
- Botão para baixar a base atual em CSV.
- Arquivo `frontend/base-selecoes-copa-2026.csv` incluído no projeto.

## Como rodar

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

A API vai abrir em:

```text
http://localhost:5000
```

### Frontend

Em outro terminal:

```bash
cd frontend
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

## Observação sobre banco SQLite

Esta versão troca a base genérica `STK001...` pela base das seleções.

Se você rodar a v1.5 em uma pasta nova, o banco será criado automaticamente com as 960 figurinhas.

Se você copiar a v1.5 por cima de uma versão antiga, a API tenta identificar a base genérica antiga e substituir pela nova base automaticamente.

## Ordem das seleções / páginas

Cada seleção foi cadastrada como uma página lógica com 20 slots:

1. África do Sul - RSA-1 até RSA-20
2. Coreia do Sul - KOR-1 até KOR-20
3. México - MEX-1 até MEX-20
4. República Tcheca - CZE-1 até CZE-20
5. Bósnia e Herzegovina - BIH-1 até BIH-20
6. Canadá - CAN-1 até CAN-20
7. Catar - QAT-1 até QAT-20
8. Suíça - SUI-1 até SUI-20
9. Brasil - BRA-1 até BRA-20
10. Escócia - SCO-1 até SCO-20
11. Haiti - HAI-1 até HAI-20
12. Marrocos - MAR-1 até MAR-20
13. Austrália - AUS-1 até AUS-20
14. Estados Unidos - USA-1 até USA-20
15. Paraguai - PAR-1 até PAR-20
16. Turquia - TUR-1 até TUR-20
17. Alemanha - GER-1 até GER-20
18. Costa do Marfim - CIV-1 até CIV-20
19. Curaçao - CUW-1 até CUW-20
20. Equador - ECU-1 até ECU-20
21. Holanda - NED-1 até NED-20
22. Japão - JPN-1 até JPN-20
23. Suécia - SWE-1 até SWE-20
24. Tunísia - TUN-1 até TUN-20
25. Bélgica - BEL-1 até BEL-20
26. Egito - EGY-1 até EGY-20
27. Irã - IRN-1 até IRN-20
28. Nova Zelândia - NZL-1 até NZL-20
29. Arábia Saudita - KSA-1 até KSA-20
30. Cabo Verde - CPV-1 até CPV-20
31. Espanha - ESP-1 até ESP-20
32. Uruguai - URU-1 até URU-20
33. França - FRA-1 até FRA-20
34. Iraque - IRQ-1 até IRQ-20
35. Noruega - NOR-1 até NOR-20
36. Senegal - SEN-1 até SEN-20
37. Argélia - ALG-1 até ALG-20
38. Argentina - ARG-1 até ARG-20
39. Áustria - AUT-1 até AUT-20
40. Jordânia - JOR-1 até JOR-20
41. Colômbia - COL-1 até COL-20
42. Portugal - POR-1 até POR-20
43. RD Congo - COD-1 até COD-20
44. Uzbequistão - UZB-1 até UZB-20
45. Croácia - CRO-1 até CRO-20
46. Gana - GHA-1 até GHA-20
47. Inglaterra - ENG-1 até ENG-20
48. Panamá - PAN-1 até PAN-20

## Próximo passo sugerido

A próxima versão pode evoluir para:

- Detecção visual semi-automática dos espaços vazios/preenchidos.
- Leitura do código da figurinha por OCR.
- Modo troca, comparando minhas repetidas com faltantes de outra pessoa.
- Login para salvar a coleção online.


## v1.5 - Ajuste visual clean

Esta versão mantém a mesma funcionalidade da v1.4 e altera apenas a experiência visual do frontend:

- Header mais leve
- Cards com menos sombra
- Fundo mais limpo
- Botões e filtros mais suaves
- Abas com visual mais discreto
- Cards de seleção, páginas e figurinhas com melhor espaçamento
- Responsividade preservada


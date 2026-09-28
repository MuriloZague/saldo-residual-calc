import { useState } from 'react';
import BeneficioCard from './components/BeneficioCard.jsx';
import Resumo from './components/Resumo.jsx';
import { STATUS_13, calcularBeneficio, parseData, parseMoeda } from './calc.js';

let proximoId = 1;
const novoBeneficio = () => ({
  id: proximoId++,
  nb: '',
  mr: '',
  dib: '',
  status13: STATUS_13.NENHUMA,
  recebido13: '',
  sem13: false,
});

export default function App() {
  const [dataObito, setDataObito] = useState('');
  const [beneficios, setBeneficios] = useState(() => [novoBeneficio()]);

  const alterarQuantidade = (e) => {
    const n = Math.max(1, Math.min(20, Number(e.target.value) || 1));
    setBeneficios((atual) =>
      n > atual.length
        ? [...atual, ...Array.from({ length: n - atual.length }, novoBeneficio)]
        : atual.slice(0, n),
    );
  };

  const atualizar = (id) => (b) => setBeneficios((atual) => atual.map((x) => (x.id === id ? b : x)));
  const remover = (id) => () => setBeneficios((atual) => atual.filter((x) => x.id !== id));

  const obito = parseData(dataObito);

  const linhas = [];
  let pendente = !obito;
  if (obito) {
    beneficios.forEach((b, i) => {
      const mr = parseMoeda(b.mr);
      const recebido13 = b.sem13 || b.recebido13 === '' ? null : parseMoeda(b.recebido13);
      if (mr == null || (!b.sem13 && b.recebido13 !== '' && recebido13 == null)) {
        pendente = true;
        return;
      }
      const dib = parseData(b.dib);
      linhas.push({
        id: b.id,
        nome: b.nb ? `NB ${b.nb}` : `Benefício ${i + 1}`,
        mr,
        r: calcularBeneficio({ mr, dib, status13: b.status13, recebido13, sem13: b.sem13 }, obito),
      });
    });
  }

  return (
    <main>
      <header>
        <h1>Calculadora de Saldo Residual — INSS</h1>
        <p>Resíduo = saldo do mês do óbito + 13º proporcional − 13º já recebido</p>
      </header>

      <section className="card topo">
        <label>
          Data do óbito
          <input type="date" value={dataObito} onChange={(e) => setDataObito(e.target.value)} />
        </label>
        <label>
          Quantidade de benefícios
          <input type="number" min="1" max="20" value={beneficios.length} onChange={alterarQuantidade} />
        </label>
      </section>

      {beneficios.map((b, i) => (
        <BeneficioCard
          key={b.id}
          indice={i}
          beneficio={b}
          onChange={atualizar(b.id)}
          onRemover={remover(b.id)}
          podeRemover={beneficios.length > 1}
        />
      ))}

      <button type="button" className="adicionar" onClick={() => setBeneficios((a) => [...a, novoBeneficio()])}>
        + Adicionar benefício
      </button>

      {pendente ? (
        <p className="aviso">Preencha a data do óbito e o MR de todos os benefícios para ver o resultado.</p>
      ) : (
        <Resumo linhas={linhas} obito={obito} />
      )}
    </main>
  );
}

import { formatarMoeda as R$ } from '../calc.js';

const valor = (c) => <span className={c < 0 ? 'negativo' : undefined}>{R$(c)}</span>;
const num = (c) => (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function Resumo({ linhas, obito }) {
  const total = linhas.reduce((s, l) => s + l.r.residuo, 0);
  const dataObito = `${String(obito.dia).padStart(2, '0')}/${String(obito.mes).padStart(2, '0')}/${obito.ano}`;

  return (
    <section className="resumo">
      <h2>Resultado — óbito em {dataObito}</h2>
      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Benefício</th>
              <th>MR</th>
              <th>Saldo do mês</th>
              <th>13º proporcional</th>
              <th>13º recebido</th>
              <th>Resíduo</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ id, nome, mr, r }) => (
              <tr key={id}>
                <td>{nome}</td>
                <td>{R$(mr)}</td>
                <td>{R$(r.saldo)}</td>
                <td>{r.sem13 ? 'Sem 13º' : R$(r.decimo)}</td>
                <td>{r.sem13 ? '—' : r.recebido ? `− ${R$(r.recebido)}` : R$(0)}</td>
                <td><strong>{valor(r.residuo)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Total do saldo residual</td>
              <td><strong>{valor(total)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {total < 0 && (
        <p className="aviso">Total negativo: o 13º já pago supera o valor devido (débito a devolver ao INSS).</p>
      )}

      <h3>Memória de cálculo</h3>
      {linhas.map(({ id, nome, mr, r }) => (
        <div key={id} className="memoria">
          <strong>{nome}</strong>
          <ul>
            <li>Saldo do mês: {num(mr)} / 30 × {r.dias} dias = {R$(r.saldo)}</li>
            {r.sem13 ? (
              <>
                <li>13º: não se aplica (benefício sem abono anual, ex.: BPC/LOAS)</li>
                <li>Resíduo: {R$(r.residuo)}</li>
              </>
            ) : (
              <>
                <li>13º proporcional: {num(mr)} / 12 × {r.meses} {r.meses === 1 ? 'mês' : 'meses'} = {R$(r.decimo)}</li>
                <li>13º já recebido: − {R$(r.recebido)}</li>
                <li>Resíduo: {R$(r.saldo)} + {R$(r.decimo)} − {R$(r.recebido)} = {R$(r.residuo)}</li>
              </>
            )}
          </ul>
        </div>
      ))}

      <button type="button" className="imprimir" onClick={() => window.print()}>
        Imprimir
      </button>
    </section>
  );
}

import { STATUS_13, formatarMoeda, parseMoeda, recebidoPadrao } from '../calc.js';

export default function BeneficioCard({ indice, beneficio, onChange, onRemover, podeRemover }) {
  const mr = parseMoeda(beneficio.mr);
  const mrInvalido = beneficio.mr !== '' && mr == null;
  const recebidoInvalido = beneficio.recebido13 !== '' && parseMoeda(beneficio.recebido13) == null;
  const padrao = mr != null ? recebidoPadrao(mr, beneficio.status13) : 0;

  const set = (campo) => (e) => onChange({ ...beneficio, [campo]: e.target.value });

  return (
    <fieldset className="card">
      <legend>Benefício {indice + 1}</legend>

      <div className="grid">
        <label>
          Nº do benefício (NB)
          <input value={beneficio.nb} onChange={set('nb')} placeholder="000.000.000-0" />
        </label>

        <label>
          MR (R$)
          <input
            value={beneficio.mr}
            onChange={set('mr')}
            inputMode="decimal"
            placeholder="1.518,00"
            aria-invalid={mrInvalido}
          />
          {mrInvalido && <span className="erro">Valor inválido</span>}
        </label>

        <label className="checkbox">
          <span>
            <input
              type="checkbox"
              checked={beneficio.sem13}
              onChange={(e) => onChange({ ...beneficio, sem13: e.target.checked })}
            />{' '}
            Benefício sem 13º
          </span>
          <span className="dica">Ex.: BPC/LOAS (espécies 87 e 88) — entra só o saldo do mês</span>
        </label>

        {!beneficio.sem13 && (
          <>
            <label>
              DIB (opcional)
              <input type="date" value={beneficio.dib} onChange={set('dib')} />
              <span className="dica">Só afeta o 13º se a DIB for no ano do óbito</span>
            </label>

            <label>
              13º já recebido no ano
              <select
                value={beneficio.status13}
                onChange={(e) => onChange({ ...beneficio, status13: e.target.value, recebido13: '' })}
              >
                <option value={STATUS_13.NENHUMA}>Nenhuma parcela</option>
                <option value={STATUS_13.PRIMEIRA}>1ª parcela</option>
                <option value={STATUS_13.AMBAS}>1ª e 2ª parcelas</option>
              </select>
            </label>
          </>
        )}

        {!beneficio.sem13 && beneficio.status13 !== STATUS_13.NENHUMA && (
          <label>
            Valor recebido de 13º (R$)
            <input
              value={beneficio.recebido13}
              onChange={set('recebido13')}
              inputMode="decimal"
              placeholder={formatarMoeda(padrao).replace('R$', '').trim()}
              aria-invalid={recebidoInvalido}
            />
            {recebidoInvalido ? (
              <span className="erro">Valor inválido</span>
            ) : (
              <span className="dica">Vazio = {formatarMoeda(padrao)} (padrão). Informe o valor do HISCRE se diferente.</span>
            )}
          </label>
        )}
      </div>

      {podeRemover && (
        <button type="button" className="link" onClick={onRemover}>
          Remover benefício
        </button>
      )}
    </fieldset>
  );
}

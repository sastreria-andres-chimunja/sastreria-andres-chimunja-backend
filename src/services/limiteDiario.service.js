import * as limiteDiarioRepository from "../repositories/limiteDiario.repository.js";

export const getLimiteDiario = async () => limiteDiarioRepository.getLimiteDiario();

export const updateLimiteDiario = async (monto) =>
  limiteDiarioRepository.updateLimiteDiario(monto);

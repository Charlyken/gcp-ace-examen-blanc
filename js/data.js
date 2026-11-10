/* Point d'accès unique à la banque de questions. */
import { DOMAINS, QUESTIONS } from "../questions.js";

export { DOMAINS, QUESTIONS };
export const Q_BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));

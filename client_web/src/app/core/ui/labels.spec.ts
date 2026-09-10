import { PRIORITY_LABEL, ROLE_LABEL, STATUS_LABEL, frDate, isOverdue } from './labels';

describe('labels', () => {
  it('traduit les trois roles', () => {
    expect(ROLE_LABEL.ADMIN).toBe('Administrateur');
    expect(ROLE_LABEL.MEMBER).toBe('Membre');
    expect(ROLE_LABEL.OBSERVER).toBe('Observateur');
  });

  it('traduit priorites et statuts', () => {
    expect(PRIORITY_LABEL.HIGH).toBe('Haute');
    expect(STATUS_LABEL.IN_PROGRESS).toBe('En cours');
    expect(STATUS_LABEL.DONE).toBe('Terminée');
  });

  describe('frDate', () => {
    it('convertit une date ISO en jj/mm/aaaa', () => {
      expect(frDate('2026-10-01')).toBe('01/10/2026');
    });

    it('affiche un tiret quand la date est absente', () => {
      expect(frDate(null)).toBe('—');
    });
  });

  describe('isOverdue', () => {
    const hier = new Date(Date.now() - 86400000).toISOString().substring(0, 10);
    const demain = new Date(Date.now() + 86400000).toISOString().substring(0, 10);

    it('signale une echeance depassee sur une tache non terminee', () => {
      expect(isOverdue(hier, 'TODO')).toBeTrue();
      expect(isOverdue(hier, 'IN_PROGRESS')).toBeTrue();
    });

    it('ne signale jamais une tache terminee', () => {
      expect(isOverdue(hier, 'DONE')).toBeFalse();
    });

    it('ne signale pas une echeance a venir', () => {
      expect(isOverdue(demain, 'TODO')).toBeFalse();
    });

    it('ne signale pas une tache sans echeance', () => {
      expect(isOverdue(null, 'TODO')).toBeFalse();
    });
  });
});

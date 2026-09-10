import { avatarColor, initials } from './initials';

describe('initials', () => {
  it('compose les initiales en majuscules', () => {
    expect(initials('Alice', 'Durand')).toBe('AD');
    expect(initials('yann', 'dipita')).toBe('YD');
  });

  it('tolere un nom manquant', () => {
    expect(initials('Alice', '')).toBe('A');
    expect(initials('', '')).toBe('');
  });
});

describe('avatarColor', () => {
  it('rend la meme couleur pour le meme identifiant', () => {
    const id = 'f96471dc-c69d-43d7-b209-ed0bcbcc2f9e';
    expect(avatarColor(id)).toBe(avatarColor(id));
  });

  it('rend toujours une couleur de la palette', () => {
    const palette = ['#14555F', '#B4531F', '#4A3F7A', '#3E6B4C', '#8A6510'];
    for (const id of ['a', 'bb', 'ccc', 'utilisateur-42', '']) {
      expect(palette).toContain(avatarColor(id));
    }
  });
});

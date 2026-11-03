import {describe, expect, it} from 'vitest';
import {localizeExplanation} from '../Quiz/format';

describe('localizeExplanation', () => {
  it('giữ nguyên khi không xáo trộn', () => {
    expect(localizeExplanation('Phương án 2 sai.', [0, 1, 2, 3])).toBe('Phương án 2 sai.');
  });
  it('đổi số phương án sang vị trí đang hiển thị', () => {
    // vị trí hiển thị 1..4 chứa phương án gốc 3,1,4,2 (index 2,0,3,1)
    const order = [2, 0, 3, 1];
    expect(localizeExplanation('Phương án 1 đúng. Phương án 2 sai, đáp án 3 sai.', order)).toBe('Phương án 2 đúng. Phương án 4 sai, đáp án 1 sai.');
  });
  it('đổi cả cách nói đầu / hai / cuối', () => {
    const order = [3, 2, 1, 0];
    expect(localizeExplanation('phương án đầu sai; phương án cuối đúng; phương án thứ hai sai.', order)).toBe('phương án 4 sai; phương án 1 đúng; phương án 3 sai.');
  });
  it('không đụng các cụm mô tả nội dung', () => {
    const t = 'Phương án bắt đầu bằng 0 sai. Phương án có 177 lời gọi sai. Ba phương án còn lại sai.';
    expect(localizeExplanation(t, [1, 0, 3, 2])).toBe(t);
  });
});

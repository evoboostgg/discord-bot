interface TicketState {
    letter: string;     
    ticketNumber: number; 
  }

  const ticketState: Record<string, TicketState> = {};
  
  function pad2(num: number): string {
    return num.toString().padStart(2, '0');
  }
  
  function incrementLetter(letter: string): string {
    const chars = letter.split('').map((c) => c.charCodeAt(0));

    for (let i = chars.length - 1; i >= 0; i--) {
      let offset = chars[i] - 65;
      offset += 1; 
  
      if (offset < 26) {
        chars[i] = 65 + offset;
        return chars.map((c) => String.fromCharCode(c)).join('');
      } else {
        chars[i] = 65;
      }
    }
  
    return 'A' + chars.map((c) => String.fromCharCode(c)).join('');
  }
  
  /**
   * @param prefix 
   * @returns 
   */
  export function getNextTicketId(prefix: 'S' | 'R' | 'O'): string {

    const now = new Date();
    const year = now.getFullYear();
    const month = pad2(now.getMonth() + 1);

    const key = `${prefix}-${year}-${month}`;
  
    if (!ticketState[key]) {
      ticketState[key] = {
        letter: 'A',
        ticketNumber: 1,
      };
    }

    let { letter, ticketNumber } = ticketState[key];
 
    const ticketNumberStr = pad2(ticketNumber);
    const ticketId = `${prefix}${month}${letter}${ticketNumberStr}`;
  
    ticketNumber++;
    if (ticketNumber > 99) {
      ticketNumber = 1;
      letter = incrementLetter(letter);
    }
  
    ticketState[key].letter = letter;
    ticketState[key].ticketNumber = ticketNumber;
  
    return ticketId;
  }
  
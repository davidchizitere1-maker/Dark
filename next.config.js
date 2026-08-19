import { createClient } from '@/utils/supabase/client';

export async function logMove(
  matchId: string, 
  turnNumber: number, 
  player: string, 
  boardState: string, 
  moveDetails: object
) {
  const supabase = createClient();
  await supabase.from('game_moves').insert({
    match_id: matchId,
    turn_number: turnNumber,
    player,
    board_state: boardState,
    move_details: moveDetails,
  });
}

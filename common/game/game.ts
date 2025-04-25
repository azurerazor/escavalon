import {
  Alignment,
  InformationOf,
  RoleId,
  ROLES,
  RoleSet,
} from "@common/game/roles.js";

/**
 * The type of a unique identifier for a user in the lobby
 */
export type UserId = string;

/**
 * Describes configuration for a single round
 */
export type RoundConfig = {
  /**
   * The number of players required to go on this mission
   */
  teamSize: number;

  /**
   * The number of fails required for this mission to fail
   */
  reqFail: number;
};

/**
 * Describes configuration for a lobby (remains constant throughout the game)
 */
export type GameConfig = {
  /**
   * The set of enabled roles for this game
   */
  roles: RoleSet;

  /**
   * The configuration for each round (zero-indexed)
   */
  rounds: RoundConfig[];

  /**
   * Whether the Lady of the Lake is enabled
   */
  ladyOfTheLake: boolean;
};

/**
 * Describes a phase within one of the 5 rounds
 */
export type RoundPhase =
  | "team_select"
  | "team_vote"
  | "mission"
  | "mission_reveal"
  | "lady_choice"
  | "lady_reveal";

/**
 * Describes the current game phase, including a phase within a round
 */
export type GamePhase =
  | "role_reveal"
  | `round:${RoundPhase}`
  | "assassination"
  | "game_over";

/**
 * Describes the ways in which a game can finish
 */
export type GameResult =
  | { reason: "vote_tracker"; winning_team: "evil" }
  | { reason: "assassination_result"; winning_team: Alignment }
  | { reason: "mission_result"; winning_team: Alignment };

/**
 * Includes how many votes have failed in a row
 */
export type WithVotesFailed<TPhase> =
  TPhase extends `round:${"team_select" | "team_vote"}`
    ? { votesFailed: number }
    : unknown;

/**
 * Includes the current team of players
 */
export type WithCurrentTeam<TPhase> =
  TPhase extends Exclude<`round:${RoundPhase}`, "round:team_select">
    ? { currentTeam: UserId[] }
    : unknown;

/**
 * Includes a count of succeeded and failed votes
 */
export type WithVotes<TPhase> = TPhase extends "round:mission_reveal"
  ? { votes: { success: number; fail: number } }
  : unknown;

/**
 * Includes the result of the game
 */
export type WithGameResult<TPhase> = TPhase extends "game_over"
  ? { result: GameResult }
  : unknown;

/**
 * Describes the current state of the game, along with any available
 * information relevant to the current phase
 */
export type GameState = {
  [TPhase in GamePhase]: {
    /**
     * The current phase of the game
     */
    phase: TPhase;

    /**
     * The configuration of the game (constant throughout phases)
     */
    config: GameConfig;

    /**
     * The list of connected players
     */
    players: UserId[];

    /**
     * The roles assigned to each player.
     * In a client game state, this only contains the player's own role.
     */
    roles: { [key: UserId]: RoleId };

    /**
     * The results of missions so far
     */
    missionResults: Alignment[];

    /**
     * The current round of the game
     */
    missionIndex: number;

    /**
     * The index of the current leader in the player list
     */
    leaderIndex: number;

    /**
     * The index of the current Lady of the Lake in the player list
     */
    ladyIndex: number;
  } & WithVotesFailed<TPhase> &
    WithCurrentTeam<TPhase> &
    WithVotes<TPhase> &
    WithGameResult<TPhase>;
}[GamePhase];

/**
 * Describes the state of the game in a specific phase
 */
export type GameStateInPhase<TPhase extends GamePhase> = GameState & {
  phase: TPhase;
};

/**
 * Describes the client-side game state, with only information visible to the given role
 */
export type ClientGameState<TRole extends RoleId> = Omit<GameState, "roles"> & {
  /**
   * The role of the user
   */
  role: TRole;

  /**
   * The information available to the current player
   */
  information: {
    /**
     * The possible roles of all players revealed to this client
     */
    rolesVisible: InformationOf<TRole>[];

    /**
     * The players who have any of the roles this player can see
     */
    playersVisible: UserId[];
  };
};

/**
 * Filters the game state to only include information for a specific role
 */
export function filterGameState<TRole extends RoleId>(
  state: GameState,
  role: TRole,
): ClientGameState<TRole> {
  const info = ROLES[role].information;
  const playersVisible: UserId[] = state.players.filter((player) => {
    const playerRole = state.roles[player];
    if (!playerRole) throw new Error(`Role not found for player: ${player}`);

    return info.has(playerRole);
  });

  return {
    ...state,
    role,
    information: {
      rolesVisible: [...info],
      playersVisible,
    },
  };
}

/**
 * Maps the game phase to the type of user input required for that phase
 */
export type UserInputByPhase = {
  "round:team_select": UserId[];
  "round:team_vote": boolean;
  "round:mission": boolean;
  "round:lady_choice": UserId;
  assassination: UserId;
};

/**
 * Describes the type of user input required for a given phase
 */
export type UserInput<TPhase extends GamePhase> =
  TPhase extends keyof UserInputByPhase ? UserInputByPhase[TPhase] : never;

/**
 * Describes a transition from some game state (in a specific phase) to another,
 * along with the type of user input required for that transition and functions
 * to decide the new game state
 */
export abstract class GameTransition<TFrom extends GamePhase> {
  abstract getTargetPlayers(state: GameStateInPhase<TFrom>): UserId[];
  abstract processInteraction(
    state: GameStateInPhase<TFrom>,
    responses: Map<UserId, UserInput<TFrom>>,
  ): GameState;
}

/**
 * team select/vote failed, advance leader and vote tracker
 */
function restartTeamSelect(
  state: GameStateInPhase<`round:${"team_select" | "team_vote"}`>,
): GameState {
  if (state.votesFailed == 4) {
    return {
      ...state,
      phase: "game_over",
      result: { reason: "vote_tracker", winning_team: "evil" },
    };
  }
  return {
    ...state,
    phase: "round:team_select",
    leaderIndex: (state.leaderIndex + 1) % state.players.length,
    votesFailed: state.votesFailed + 1,
  };
}

/**
 * Describes the flow of the game through transitions from all phases
 */
export const GAME_FLOW: { [TFrom in GamePhase]: GameTransition<TFrom> } = {
  /**
   * Role reveal: all players receive their role assignment + information
   */
  role_reveal: {
    getTargetPlayers(_state): UserId[] {
      return [];
    },
    processInteraction(state, _responses): GameState {
      return {
        ...state,
        phase: "round:team_select",
        votesFailed: 0,
      };
    },
  },

  /**
   * Team selection: the current leader selects a team to go on this mission
   */
  "round:team_select": {
    getTargetPlayers(state: GameStateInPhase<"round:team_select">): UserId[] {
      return [state.players[state.leaderIndex]];
    },
    processInteraction(
      state: GameStateInPhase<"round:team_select">,
      responses: Map<UserId, UserId[]>,
    ): GameState {
      const team = [
        ...new Set(responses.get(state.players[state.leaderIndex]) ?? []),
      ].filter((player) => player in state.players);
      if (team.length != state.config.rounds[state.missionIndex].teamSize) {
        return restartTeamSelect(state);
      }
      return {
        ...state,
        phase: "round:team_vote",
        currentTeam: team,
      };
    },
  },

  /**
   * Team voting: all players vote to approve or reject the proposed team
   */
  "round:team_vote": {
    getTargetPlayers(state): UserId[] {
      return state.players;
    },
    processInteraction(state, responses): GameState {
      let votes = 0;
      for (const player in state.players) {
        if (responses.get(player) === true) {
          votes++;
        }
      }
      if (2 * votes <= state.players.length) {
        return restartTeamSelect(state);
      }
      return {
        ...state,
        phase: "round:mission",
      };
    },
  },

  /**
   * Mission: the current team passes or fails the ongoing mission
   */
  "round:mission": {
    getTargetPlayers(state): UserId[] {
      return state.currentTeam;
    },
    processInteraction(state, responses): GameState {
      let success = 0,
        fail = 0;
      for (const player in state.currentTeam) {
        // undefined assumes success
        if (responses.get(player) === false) {
          fail++;
        } else {
          success++;
        }
      }
      // Retrieve the number of fails required from round config
      const reqFails = state.config.rounds[state.missionIndex].reqFail;
      return {
        ...state,
        phase: "round:mission_reveal",
        votes: { success, fail },
        missionResults: [
          ...state.missionResults,
          fail < reqFails ? "good" : "evil",
        ],
      };
    },
  },

  /**
   * Mission reveal: the results of the mission are shown to all players
   */
  "round:mission_reveal": {
    getTargetPlayers(_state): UserId[] {
      return [];
    },
    processInteraction(state, _responses): GameState {
      if (state.missionResults.filter((x) => x == "good").length >= 3) {
        // good team win
        if (state.config.roles.has("assassin")) {
          return {
            ...state,
            phase: "assassination",
          };
        }
        return {
          ...state,
          phase: "game_over",
          result: { reason: "mission_result", winning_team: "good" },
        };
      }
      if (state.missionResults.filter((x) => x == "evil").length >= 3) {
        // evil team win
        return {
          ...state,
          phase: "game_over",
          result: { reason: "mission_result", winning_team: "evil" },
        };
      }
      if (state.config.ladyOfTheLake) {
        return {
          ...state,
          phase: "round:lady_choice",
        };
      }
      return {
        ...state,
        phase: "round:team_select",
        votesFailed: 0,
        leaderIndex: (state.leaderIndex + 1) % state.players.length,
      };
    },
  },

  /**
   * Lady of the Lake: the current player chooses a player whose role to see
   */
  "round:lady_choice": {
    getTargetPlayers(_state): UserId[] {
      throw Error("not implemented");
    },
    processInteraction(_state, _responses): GameState {
      throw Error("not implemented");
    },
  },

  /**
   * Lady of the Lake reveal: the chosen player's role is revealed to the player with the Lady
   */
  "round:lady_reveal": {
    getTargetPlayers(_state): UserId[] {
      throw Error("not implemented");
    },
    processInteraction(_state, _responses): GameState {
      throw Error("not implemented");
    },
  },

  /**
   * Assassination: the assassin (or all evil players) guess(es) the identity of Merlin
   */
  assassination: {
    getTargetPlayers(state): UserId[] {
      return [
        state.players.filter((player) => state.roles[player] == "assassin")[0],
      ];
    },
    processInteraction(state, responses): GameState {
      const assassin = state.players.filter(
        (player) => state.roles[player] == "assassin",
      )[0];
      const target = responses.get(assassin);
      if (typeof target == "string" && state.roles[target] == "merlin") {
        return {
          ...state,
          phase: "game_over",
          result: { reason: "assassination_result", winning_team: "evil" },
        };
      } else {
        return {
          ...state,
          phase: "game_over",
          result: { reason: "assassination_result", winning_team: "good" },
        };
      }
    },
  },

  /**
   * Game over: the game ends and results are shown to all players
   */
  game_over: {
    getTargetPlayers(_state): UserId[] {
      return [];
    },
    processInteraction(state, _responses): GameState {
      return state;
    },
  },
};

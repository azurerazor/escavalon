import { MISSION_OUTCOME_TIME, SECONDS } from "@common/game/timing";
import { Player } from "../../../../common/game/player";
import { Role, getRoles } from "../../../../common/game/roles";
import { fails, quests } from "../pages/GameFlow";
import RoleRevealInfo from "./RoleRevealInfo";
import { useState, useEffect } from "react";

interface Props {
  outcomes: number[];
  numberOfPlayers: number;
  round: number;
  onClose?: () => void;
}

const MissionRevealCard: React.FC<Props> = ({ outcomes, numberOfPlayers, round, onClose }) => {
  const succy = quests[numberOfPlayers][round]-outcomes[round];
  const fail = outcomes[round];

  const [counter, setCounter] = useState(MISSION_OUTCOME_TIME / SECONDS);
          
    useEffect(() => {
      const interval = setInterval(() => {
      setCounter((prev) => {
          if (prev <= 1) {
          clearInterval(interval);
          return 0;
          }
          return prev - 1;
      });
      }, 1000);

      return () => clearInterval(interval);
    }, []);
  
  const verdict = fail < fails[numberOfPlayers][round] ? "Success" : "Fail";

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="absolute top-4 right-4">
        <span id="counterElement" className="countdown font-bold">
          {counter}
        </span>
      </div>
      <div className="card-body w-full">
          <h1 className="text-xl font-bold flex-row">Mission {verdict}</h1>
          <div className="join join-horizontal flex justify-between space-x-5">
          <div className="flex flex-col items-center">
            <img src={"/images/success.png"} alt="Success Card" className="w-60 h-5/6" />
            <h2 className="text-xl font-bold mt-2">{succy}</h2>
          </div>
          <div className="flex flex-col items-center">
            <img src={"/images/fail.png"} alt="Fail Card" className="w-60 h-5/6" />
            <h2 className="text-xl font-bold mt-2">{fail}</h2>
          </div>
          </div>
          {onClose && (
          <button
              onClick={onClose}
              className="mt-6 self-end bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
              Continue
          </button>
          )}
      </div>
    </div>
  );
};

export default MissionRevealCard;

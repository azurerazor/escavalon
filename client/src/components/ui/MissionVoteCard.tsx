import { Player } from "../../../../common/game/player";
import { Roles, getRoles } from "../../../../common/game/roles";
import { ClientLobby } from "../../game/lobby";
import FunctionButton from "../misc/FunctionButton";
import { useState } from 'react';

interface Props {
  selectedTeam: string[];
  players: Map<string, Player>;
  setAcceptReject: React.Dispatch<React.SetStateAction<boolean | null>>;
}

const MissionVoteCard: React.FC<Props> = ({ selectedTeam, players, setAcceptReject }) => {
    const selectedPlayers = Array.from(players)
      .filter(([_, player]) => selectedTeam.includes(player.username))
      .map(([_, player]) => player);
    const accept = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/SMirC-thumbsup.svg/2048px-SMirC-thumbsup.svg.png";
    const reject = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/SMirC-thumbsdown.svg/1200px-SMirC-thumbsdown.svg.png";

    const [leftActive, setLeft] = useState(false);
    const [rightActive, setRight] = useState(false);

    const handleAccept = () => {
        console.log("accepted");
        if (!leftActive) {
            setAcceptReject(true);
            setRight(false);
            setLeft(leftActive => !leftActive);
        }
    };

    const handleReject = () => {
        console.log("rejected");
        if (!rightActive) {
            setAcceptReject(false);
            setLeft(false);
            setRight(rightActive => !rightActive);
        }
    };

    return (
        <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-col">
            <h1 className="text-xl font-bold flex-row">Vote for this mission:</h1>
            <div className="justify-center join join-horizontal">
                {selectedPlayers.map((p) => (
                    <div key={p.username} className="flex flex-col">
                    <div className="avatar p-1">
                      <div className="w-14 rounded border-4">
                        <img src={p.avatar} alt={p.username} />
                      </div>
                    </div>
                    <h2 className="text-sm font-semibold">{p.username}</h2>
                  </div>                
                ))}
            </div>
            <div className="join join-horizontal flex justify-between space-x-5">
                <img src={accept} alt="Accept Card" 
                  className={`w-60 border-6 ${leftActive ? 'border-blue-400' : 'border-transparent'}`}
                  onClick={handleAccept}
                />
                <img src={reject} alt="Reject Card" 
                  className={`w-60 border-6 ${rightActive ? 'border-blue-400' : 'border-transparent'}`} 
                  onClick={handleReject}
                />
            </div>
            <div className="flex-row"><FunctionButton label="Submit" /></div>
        </div>
        </div>
    );
};

export default MissionVoteCard;


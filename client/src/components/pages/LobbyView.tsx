import { useState, useEffect } from 'react';
import FaceCard from "../ui/FaceCard";
import PlayerProfile from "../ui/PlayerProfile";
import RouteButton from "../misc/RouteButton";
import { getRoles, Roles } from "../../../../common/game/roles";
import { Player } from "../../../../common/game/player";
import { RolesetContextProvider } from 'util/rolesetContext';
import FunctionButton from '../misc/FunctionButton';
import { ClientEventBroker } from 'game/events';
import { useNavigate } from 'react-router';

type Props = {
  players: Map<string, Player>;
  changeView: boolean;
  setChangeView: React.Dispatch<React.SetStateAction<boolean>>;
  lobbyId: string;
  enabledRoles: Roles;
  setEnabledRoles: React.Dispatch<React.SetStateAction<Roles>>;
  myPlayer: Player;
};

export default function LobbyView({ players, changeView, setChangeView, lobbyId, enabledRoles, setEnabledRoles, myPlayer }: Props) {
    let specialRoles = getRoles(Roles.SPECIAL_ROLES);
    const grayscaleVal = (!myPlayer.isHost || players.size < 5) ? 100 : 0;

    const navigate = useNavigate();
    return (
        <RolesetContextProvider>
            <div className="flex justify-center gap-4 p-4 h-screen">
                <div className="flex flex-col justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-bold">Lobby Code: {lobbyId}</h2>
                        <hr className="mb-2" />
                        {Array.from(players.entries()).map(([username, player], idx) => (
                            <PlayerProfile
                                key={idx}
                                player={player}
                            />
                        ))}

                    </div>
                    <div className="flex justify-between items-center">
                        <div style={{ filter: `grayscale(${grayscaleVal}%)` }}>
                            <FunctionButton
                                label="Start"
                                onClick={() => { if(grayscaleVal === 0) setChangeView(true)}}
                            />
                        </div>
                        <FunctionButton label={'Exit'} onClick={() => {
                            ClientEventBroker.disconnect();
                            navigate('/dashboard');
                        }}/>
                    </div>
                </div>

                <div className="grid grid-rows-2 grid-cols-3 gap-4 gap-x-4 justify-between">
                    
                    {specialRoles.map((role, idx) => (
                        <FaceCard
                            key = {idx}
                            role = {role}
                            enabledRoles = {enabledRoles}
                            setEnabledRoles = {setEnabledRoles}
                            myPlayer = {myPlayer}
                            status = {role.is(enabledRoles)}
                        />
                    ))}

                </div>
            </div>
        </RolesetContextProvider>
    );
}

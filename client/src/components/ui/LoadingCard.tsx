import { Player } from "../../../../common/game/player";
import { Roles, getRoles } from "../../../../common/game/roles";
import FunctionButton from "../misc/FunctionButton";
import { useState, useEffect } from 'react';
import AssassinationPlayerSelect from "./AssassinationPlayerSelect";
import { MISSION_CHOICE_TIME, SECONDS } from "@common/game/timing";

interface Props {
    message: string
}

const LoadingCard: React.FC<Props> = ({ message }) => {
    const [counter, setCounter] = useState(MISSION_CHOICE_TIME / SECONDS);
        
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


    return (
        <div className="card bg-base-100 shadow-sm">
        <div className="absolute top-4 right-4">
            <span id="counterElement" className="countdown">
                {counter}
            </span>
        </div>
        <div className="card-body w-full">
            <h1 className="text-5xl font-bold flex-row">{message}</h1>
        </div>
        </div>
    );
};

export default LoadingCard;


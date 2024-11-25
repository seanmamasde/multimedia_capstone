"use client";

import AppMenubar from "../../menubar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/utils/jwtAuth";
import "@/style/teams.css"

export default function createTeam() {
    const router = useRouter();
    const [teamName, setTeamName] = useState('');
    const [numMembers, setNumMembers] = useState(1);
    const [userNames, setUserNames] = useState(['', '', '', '']);
    const [uname, setUname ] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
            const payload = JSON.parse(decodeJwt(token));
            setUname(payload.username);

            // set user as first member by default
            if (userNames[0] == '')
            {
                const newUserNames = [...userNames];
                newUserNames[0] = payload.username;
                setUserNames(newUserNames);
            }
        } catch (error) {
            console.error("Failed to decode token:", error);
            localStorage.removeItem("token");
            router.push("/login");
        }
    }, [])


    const handleTeamNameChange = (e) => {
        setTeamName(e.target.value);
    };

    const handleNumMembersChange = (e) => {
        const num = parseInt(e.target.value);
        setNumMembers(num);
    };

    const handleUserNameChange = (index, e) => {
        const newUserNames = [...userNames];
        newUserNames[index] = e.target.value;
        setUserNames(newUserNames);
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        // ensure team contains the user
        if (!userNames.includes(uname))
        {
            alert(`別亂幫別人組隊好嗎🗿`);
            return;
        }

        // ensure all usernames are valid
        const validateRes = await fetch("/api/dbConnect/validateUsers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userNames: userNames.slice(0, numMembers) })
        });

        const data = await validateRes.json();

        if (data.missingUsers.length != 0)
        {
            alert(`無效成員 ${data.missingUsers}，請確認成員名稱`);
            return;
        }

        // send team creation request
        const res = await fetch("/api/dbConnect/createTeam", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({teamName: teamName, numMembers: numMembers, userNames: userNames})
        });
        
        if (res.status == 200)
        {
            console.log("Success.");
            router.push("/team");
        }
        else
        {
            alert("Team Creation Failed.")
        }
    };

    return (
        <div>
            <AppMenubar />
            <h2>建立隊伍</h2>
            <form onSubmit={handleSubmit}>
                <div className="team-edit-field">
                    <label htmlFor="teamName">隊伍名稱</label>
                    <input
                        type="text"
                        id="teamName"
                        value={teamName}
                        onChange={handleTeamNameChange}
                        required
                    />
                </div>

                <div className="team-edit-field">
                    <label htmlFor="numMembers">隊伍人數</label>
                    <select
                        id="numMembers"
                        value={numMembers}
                        onChange={handleNumMembersChange}
                    >
                        {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                        ))}
                    </select>
                </div>

                {[...Array(numMembers)].map((_, index) => (
                    <div key={index} className="team-edit-field">
                        <label htmlFor={`userName-${index}`}>成員 {index + 1} 帳號名稱:</label>
                        <input
                        type="text"
                        id={`userName-${index}`}
                        value={userNames[index]}
                        onChange={(e) => handleUserNameChange(index, e)}
                        required
                        />
                    </div>
                ))}

                <div className="team-edit-field">
                    <button type="submit">建立</button>
                </div>
            </form>
        </div>
    );
}
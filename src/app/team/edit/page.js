"use client";

import AppMenubar from "../../menubar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { decodeJwt } from "@/utils/jwtAuth";

export default function TeamEdit() {
    const [ team, setTeam ] = useState( { id: "",
                                        teamname: "",
                                        memberNum: 1,
                                        uname1: "",
                                        uname2: "",
                                        uname3: "",
                                        uname4: "" } );
    const [ originalteam, setOriginalTeam ] = useState(null);
    const [ uname, setUname ] = useState(null);
    
    const router = useRouter();
    console.log(window.location.href);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.href.split('?')[1]);
        const tid = queryParams.get("tid");
        
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        
        let payload = {};
        try {
          payload = JSON.parse(decodeJwt(token));
          setUname(payload.username);
        } catch (error) {
          console.error("Failed to decode token:", error);
          localStorage.removeItem("token");
          router.push("/login");
        }
    
        const fetchTeam = async () => {
          const res = await fetch(`/api/dbConnect/teamByTid?tid=${tid}`);
          const data = await res.json();
          setTeam(data);
          setOriginalTeam(data);

          console.log(payload.username);
        };
    
        fetchTeam();

        if (!(team.id == "") && ![team.uname1, team.uname2, team.uname3, team.uname4].includes(payload.username)) {
            // use effect gets called twice on dev mode due to nextjs' strict mode
            // should work fine on prod, or test with strict mode disabled
            router.back();
            alert("You do not have the permission to view this page.");
        }
    }, [router]);
    
    const handleSubmit = async(e) => {
        e.preventDefault();
        if (JSON.stringify(team) == JSON.stringify(originalteam)) {
            alert("無改動");
        }

        //same checks as create team
        const userNames = [team.uname1, team.uname2, team.uname3, team.uname4];
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
            body: JSON.stringify({ userNames: userNames.slice(0, team.memberNum) })
        });

        const data = await validateRes.json();

        if (data.missingUsers.length != 0)
        {
            alert(`無效成員 ${data.missingUsers}，請確認成員名稱`);
            return;
        }

        const res = await fetch("/api/dbConnect/editTeam", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ team: team })
        });

        if (res.status == 200)
        {
            console.log("Success.");
            router.push("/team");
        }
        else
        {
            alert("Could not update team")
        }
    }

    const handleTeamNameChange = (e) => {
        setTeam(prevData => ({
            ...prevData,
            teamname: e.target.value
        }))
    };

    const handleNumMembersChange = (e) => {
        const num = parseInt(e.target.value);
        setTeam(prevData => ({
            ...prevData,
            memberNum: num
        }))
    };

    const handleUserNameChange = (index, e) => {
        setTeam(prevData => ({
            ...prevData,
            [`uname${index + 1}`]: e.target.value
        }))
    };

    return (
        <div>
            <AppMenubar />
            <h2>編輯隊伍</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="teamName">隊伍名稱</label>
                    <input
                        type="text"
                        id="teamName"
                        value={team.teamname}
                        onChange={handleTeamNameChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="numMembers">隊伍人數</label>
                    <select
                        id="numMembers"
                        value={team.memberNum}
                        onChange={handleNumMembersChange}
                    >
                        {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                        ))}
                    </select>
                </div>

                {[...Array(team.memberNum)].map((_, index) => (
                    <div key={index}>
                        <label htmlFor={`userName-${index}`}>成員 {index + 1} 帳號名稱:</label>
                        <input
                        type="text"
                        id={`userName-${index}`}
                        value={[team.uname1, team.uname2, team.uname3, team.uname4][index]}
                        onChange={(e) => handleUserNameChange(index, e)}
                        required
                        />
                    </div>
                ))}

                <div>
                    <button type="submit">完成編輯</button>
                </div>
            </form>
        </div>
    )
}
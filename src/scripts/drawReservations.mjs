import dotenv from "dotenv";
import dbConnect from "../utils/db.js";
import Court from "../models/Court.js";
import promptSync from "prompt-sync";
import { Reservation } from "../models/Reservation.js";
import next from "next";

dotenv.config();
const prompt = promptSync({ sigint: true });

async function drawAndAddToCourts()
{
    await dbConnect();
    let next_week = new Date();
    next_week.setDate(next_week.getDate() + 7);
    let def_iso = next_week.toISOString().split("T")[0];
    let startDate;
    let startDateISO;
    let endDateISO;

    let correct = false;
    console.log("[CAUTION!!!] Running this script will shift the registered courts left by 1 day! (Registrations on the oldest day will be popped)");

    while(!correct) {
        const startDateStr = prompt(`Enter the start date (YYYY-MM-DD) (default : ${def_iso}): `, def_iso);
        startDate = new Date(startDateStr)
        startDateISO = startDate.toISOString();
        
        if (prompt(`Your entered start date is ${startDateISO}. \n Is the date correct? ([y]/n) : `, "y") == "y")
            correct = true;
    }

    const shiftReservations = prompt("Shift reservations? (y/[n])", "n") == "y";

    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDateISO = endDate.toISOString();

    console.log(endDateISO);
    
    const reservations_in_range = await Reservation.find({ date: startDateISO });

    const past_week_start = new Date(startDate);
    past_week_start.setDate(past_week_start.getDate() - 7);

    const past_week_end = new Date(endDate);
    past_week_end.setDate(past_week_end.getDate() - 7);

    //console.log(past_week_start.toISOString(), past_week_end.toISOString());
    
    const moveISO = (iso, days) => {
        let date = new Date(iso);
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    const courts = await Court.find({
        date: {
          $gte: moveISO(past_week_start.toISOString(), 1),
          $lte: past_week_end.toISOString(),
        },
    });
    
    // shift by 1 day
    courts.forEach((c) => {
        c.date = moveISO(c.date, -1);
    })


    function shuffle(arr) {
        let shuffled = arr.slice();
    
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    // create copy
    let remaining_teams = reservations_in_range.slice();
    let reservation_dict = {};

    ["first", "second", "third"].forEach((pref) => {
        let shuffled = shuffle(remaining_teams);

        for (let i = shuffled.length - 1; i >= 0; i--) {
            const date_str = new Date(shuffled[i].date).toISOString().split("T")[0];
            const pref_time = shuffled[i].preferences[pref];

            if (!reservation_dict[date_str])
                reservation_dict[date_str] = {};
            
            if (!reservation_dict[date_str][pref_time])
                reservation_dict[date_str][pref_time] = []

            // time slot can still accommodate team
            if (reservation_dict[date_str][pref_time].length < 6) {
                reservation_dict[date_str][pref_time].push(shuffled[i].teamId);

                // remove that team
                shuffled.splice(i, 1);
            }
        }

        remaining_teams = shuffled;
    });

    function printData(data) {
        for (const date in data) {
          console.log(`Date: ${date}`);
          
          const timeSlots = data[date];
          for (const time in timeSlots) {
            console.log(`  Time: ${time}`);
            const entry = timeSlots[time];
      
            for (const key in entry) {
              console.log(`    ${entry[key].length > 0 ? entry[key] : 'No items'}`);
            }
          }
        }
    }
    
    console.log("=============Result==============")
    printData(reservation_dict);
    console.log("=============New Entries============")

    // start drawing
    for (const date in reservation_dict) {
        
        const timeSlots = reservation_dict[date];
        for (const time in timeSlots){

            const selected_teams = timeSlots[time];
            const selected_teams_size = selected_teams.length;

            let courtEntry = {
                date: past_week_end,
                timeSlot: time,
                reservedCourts: 0,
                totalCourts: 6,
                teams: {},
                firstChoiceTeams: [],
                secondChoiceTeams: [],
                thirdChoiceTeams: [],
                waitlistTeams: []
            }

            const alphabets = ["A", "B", "C", "D", "E", "F"];

            courtEntry.reservedCourts = selected_teams_size;

            for (let i = 0; i < selected_teams_size; ++i)
            {
                courtEntry.teams[selected_teams[i]] = alphabets[i];
                courtEntry.firstChoiceTeams.push(`${selected_teams[i]}-${alphabets[i]}`)
            }

            //console.log(courtEntry);
            courts.push(courtEntry);
        }
    }
    //console.log(reservations_in_range);
    console.log(courts); 

    if (!prompt("Courts will be OVERWRITTEN by the above entries. Commit changes? (y/[n])", "n") == "y")
    {
        console.log("aborting")
        process.exit();
    }

    // delete all old entries
    let result = await Court.deleteMany({
            date: {
            $gte: past_week_start.toISOString(),
            $lte: past_week_end.toISOString(),
            }
        });

    console.log(`Deleted ${result.deletedCount} from court`);

    result = await Court.insertMany(courts);

    console.log(`Inserted ${result.length} to court (old - first day + new)`);
    
    if (!shiftReservations)
        process.exit();

    // delete old reservation
    result = await Reservation.deleteMany({
        date: {
          $gte: startDateISO,
          $lte: endDateISO,
        }
    })

    console.log(`Deleted ${result.deletedCount} from reservation`);

    let newer_dates = reservations_in_range.filter(r => r.date.toISOString() != startDateISO);

    newer_dates.forEach((c) => {
        c.date = moveISO(c.date, -1);
    })

    result = await Reservation.insertMany(newer_dates);

    console.log(`Inserted ${result.length} to reservation (old - first day)`);
    
    process.exit();
}

drawAndAddToCourts().catch((err) => {
    console.error("[Error]", err);
    process.exit(1);
});
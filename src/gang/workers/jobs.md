# Gang Jobs Reference

## Job Statistics

| Name | Description | Type | Base Respect | Base Wanted | Base Money | Difficulty | Hack | Str | Def | Dex | Agi | Cha |
|------|-------------|------|--------------|-------------|------------|------------|------|-----|-----|-----|-----|-----|
| Ransomware | Assign this gang member to create and distribute ransomware<br><br>Earns money - Slightly increases respect - Slightly increases wanted level | Hacking | 0.00005 | 0.0001 | 3 | 1 | 100 | 0 | 0 | 0 | 0 | 0 |
| Phishing | Assign this gang member to attempt phishing scams and attacks<br><br>Earns money - Slightly increases respect - Slightly increases wanted level | Hacking | 0.00008 | 0.003 | 7.5 | 3.5 | 85 | 0 | 0 | 0 | 0 | 15 |
| Identity Theft | Assign this gang member to attempt identity theft<br><br>Earns money - Increases respect - Increases wanted level | Hacking | 0.0001 | 0.075 | 18 | 5 | 80 | 0 | 0 | 0 | 0 | 20 |
| DDoS Attacks | Assign this gang member to carry out DDoS attacks<br><br>Increases respect - Increases wanted level | Hacking | 0.0004 | 0.2 | 0 | 8 | 100 | 0 | 0 | 0 | 0 | 0 |
| Plant Virus | Assign this gang member to create and distribute malicious viruses<br><br>Increases respect - Increases wanted level | Hacking | 0.0006 | 0.4 | 0 | 12 | 100 | 0 | 0 | 0 | 0 | 0 |
| Fraud & Counterfeiting | Assign this gang member to commit financial fraud and digital counterfeiting<br><br>Earns money - Slightly increases respect - Slightly increases wanted level | Hacking | 0.0004 | 0.3 | 45 | 20 | 80 | 0 | 0 | 0 | 0 | 20 |
| Money Laundering | Assign this gang member to launder money<br><br>Earns money - Increases respect - Increases wanted level | Hacking | 0.001 | 1.25 | 360 | 25 | 75 | 0 | 0 | 0 | 0 | 25 |
| Cyberterrorism | Assign this gang member to commit acts of cyberterrorism<br><br>Greatly increases respect - Greatly increases wanted level | Hacking | 0.01 | 6 | 0 | 36 | 80 | 0 | 0 | 0 | 0 | 20 |
| Ethical Hacking | Assign this gang member to be an ethical hacker for corporations<br><br>Earns money - Lowers wanted level | Hacking | 0 | -0.001 | 3 | 1 | 90 | 0 | 0 | 0 | 0 | 10 |
| Vigilante Justice | Assign this gang member to be a vigilante and protect the city from criminals<br><br>Decreases wanted level | Hacking/Combat | 0 | -0.001 | 0 | 1 | 20 | 20 | 20 | 20 | 20 | 0 |
| Train Combat | Assign this gang member to increase their combat stats (str, def, dex, agi) | Hacking/Combat | 0 | 0 | 0 | 100 | 0 | 25 | 25 | 25 | 25 | 0 |
| Train Hacking | Assign this gang member to train their hacking skills | Hacking/Combat | 0 | 0 | 0 | 45 | 100 | 0 | 0 | 0 | 0 | 0 |
| Train Charisma | Assign this gang member to train their charisma | Hacking/Combat | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 100 |
| Territory Warfare | Members assigned to this task increase your gang's power. They will also fight for territory if 'Territory Clashes' are enabled.<br /><br />Gang members performing this task can be killed during clashes. | Hacking/Combat | 0 | 0 | 0 | 5 | 15 | 20 | 20 | 20 | 20 | 5 |

## Notes

- **Type**: Indicates whether the job uses Hacking stats, Combat stats, or both
- **Base Respect/Wanted/Money**: These are **multipliers**, not final values! The actual gain is calculated as:
  ```
  weighted_stat = (hack × hackWeight + str × strWeight + def × defWeight + 
                   dex × dexWeight + agi × agiWeight + cha × chaWeight) / total_weight
  Actual Gain = baseValue × weighted_stat × territory_multiplier
  ```
  - The weighted stat average uses **only the stats with non-zero weights** for that job
  - **Not just hacking level!** Each job uses different stat combinations:
    - DDoS (hackWeight: 100) → uses 100% hacking stat
    - Phishing (hackWeight: 85, chaWeight: 15) → uses 85% hacking + 15% charisma
    - Vigilante Justice (all combat stats) → uses weighted combo of all combat stats + hacking
  - Higher member stats = much higher actual gains
  - Example: DDoS has `baseWanted: 0.2`, but with a high-hacking member (1000+ hack), the actual wanted gain can be 2-20+ per tick
- **Difficulty**: Higher difficulty means the job is harder to complete effectively
- **Stat Weights**: The relative importance of each stat for job performance (0-100 scale). These determine which stats are used in the weighted average calculation
- **Territory Multipliers**: All jobs have territory multipliers of 1.0 for money, respect, and wanted, except Vigilante Justice which has 0.9 for wanted

## Calculating Actual Gains

Use these Bitburner API functions to see actual gains:
- `ns.gang.wantedLevelGain(gang, member, task)` - Actual wanted gain per tick
- `ns.gang.respectGain(gang, member, task)` - Actual respect gain per tick  
- `ns.gang.moneyGain(gang, member, task)` - Actual money gain per tick

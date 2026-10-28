// Keep total outgoing video bounded as a mesh grows, leaving room for speech.
export function groupVideoBudget(remoteCount,mobile=false){
  const count=Math.max(1,remoteCount||1),group=count>=3;
  return {
    camera:{maxBitrate:group?Math.floor((mobile?1_200_000:2_000_000)/count):mobile?600_000:2_000_000,maxFramerate:mobile||group?15:30,maxDimension:group?(count>=5?480:640):mobile?640:0,light:mobile||group},
    screen:{maxBitrate:group?Math.floor((mobile?1_800_000:3_000_000)/count):mobile?1_200_000:4_000_000,maxFramerate:group?8:mobile?10:30,maxDimension:mobile||group?1280:0,light:mobile||group}
  };
}

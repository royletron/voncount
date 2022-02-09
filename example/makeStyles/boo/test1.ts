import AvatarBackground from "boring-avatars";
import { makeStyles } from "@material-ui/core/styles";
import md5 from "md5";

const getFontSize = (size) => {
  if (size < 30) {
    return 12;
  } else if (size < 40) {
    return 16;
  } else {
    return 20;
  }
};

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    margin: "0 auto",
  },
  text: {
    display: "flex",
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: theme.palette.common.white,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "50%",
  },
}));

interface Props extends HTMLAttributes<HTMLDivElement> {
  name: string;
  image: string;
  className?: string;
  size?: number;
}

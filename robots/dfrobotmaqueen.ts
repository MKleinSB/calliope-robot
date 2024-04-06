namespace robot {
    const I2C_ADRESS = 0x10
    const M1_INDEX = 0
    const M2_INDEX = 0x02
    const FORWARD = 0
    const BACKWARD = 1
    const PatrolLeft = 0
    const PatrolRight = 1
    const LINE_STATE_REGISTER = 0x1d
    const enum I2Cservos {
        S1=0x01,
        S2=0x02
    }
    let StatePuffer = 0

    function run(index: number, speed: number): void {
        const buf = pins.createBuffer(3)
        const direction = speed > 0 ? FORWARD : BACKWARD
        const s = Math.round(Math.map(Math.abs(speed), 0, 100, 0, 255))
        buf[0] = index
        buf[1] = direction
        buf[2] = s
        pins.i2cWriteBuffer(I2C_ADRESS, buf)
    }

    function readData(reg: number, len: number): Buffer {
        pins.i2cWriteNumber(I2C_ADRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadBuffer(I2C_ADRESS, len, false);
    }

    function writeData(buf: number[]): void {
        pins.i2cWriteBuffer(I2C_ADRESS, pins.createBufferFromArray(buf));
    }

    class I2CLineDetector implements drivers.LineDetectors {
        start(): void { }
        lineState(state: number[]): void {
            const v = this.readPatrol()
            StatePuffer = (v & 0x01) == 0x01 ? 1023 : 0;
            state[RobotLineDetector.Right] = (StatePuffer << 0)
            StatePuffer = (v & 0x02) == 0x02 ? 1023 : 0;
            state[RobotLineDetector.Left] = (StatePuffer << 1)
        }

        private readPatrol() {
            return robots.i2cReadRegU8(I2C_ADRESS, LINE_STATE_REGISTER)
        }
    }

    class I2CSonar implements drivers.Sonar {
        start(): void { }
        distance(maxCmDistance: number): number {
        let integer = readData(0x28, 2);
        let distance = integer[0] << 8 | integer[1];
        return (distance > 399 || distance < 1) ? -1 : distance;   
        }
    }

    class PwmArm implements drivers.Arm {
        constructor(public readonly servo: I2Cservos) { }
        start() { }
        open(aperture: number) {
             writeData([0x14, aperture]);

        }
    }

//    export function servoRun(index: Servos, angle: number): void {
//        if (index == Servos.S1) {
//            writeData([0x14, angle]);
//        } else if (index == Servos.S2) {
//            writeData([0x15, angle]);
//        } else {
//            writeData([0x14, angle]);
//            writeData([0x15, angle]);
//        }
//    }

    // https://github.com/DFRobot/pxt-maqueen/blob/master/maqueen.ts
    class DFRobotMaqueenRobot extends robots.Robot {
        constructor() {
            super(0x325e1e40)
            this.lineDetectors = new I2CLineDetector()
            this.sonar = new I2CSonar()
            this.arms = [new PwmArm(I2Cservos.S1)]
        }

        motorRun(left: number, right: number): void {
            run(M1_INDEX, left)
            run(M2_INDEX, right)
        }

        headlightsSetColor(r: number, g: number, b: number) {
            writeData([0x18, r]);
            writeData([0x19, g]);
            writeData([0x1A, b]);
        }

    }
 //ultrasonic(unit: DistanceUnit, maxCmDistance = 500): number {
 //       let integer = readData(0x28, 2);
 //       let distance = integer[0] << 8 | integer[1];
 //       return (distance > 399 || distance < 1) ? -1 : distance;
 //   }

    /**
     * Calliope Motionkit2
     */
    //% fixedInstance block="calliope motionkit2" whenUsed weight=80
    export const dfRobotMaqueen = new RobotDriver(new DFRobotMaqueenRobot())
}
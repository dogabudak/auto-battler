import { Unit, BoardState, Position, BattleLog, SimulationResult, BOARD_CONFIG } from '../types/index.js';

const MAX_TICKS = 500;

export class BattleSimulator {
  private units: Map<string, Unit> = new Map();
  private battleLog: BattleLog = [];
  private tick: number = 0;

  private cloneUnit(unit: Unit): Unit {
    return { ...unit };
  }

  private initializeBoard(state: BoardState): void {
    this.units.clear();
    this.battleLog = [];
    this.tick = 0;

    for (const unit of state.units) {
      this.units.set(unit.id, this.cloneUnit(unit));
    }
  }

  private getAliveUnits(): Unit[] {
    return Array.from(this.units.values()).filter(u => u.hp > 0);
  }

  private getDistance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private findTarget(unit: Unit): Unit | null {
    const others = this.getAliveUnits().filter(u => u.id !== unit.id);
    if (others.length === 0) return null;

    let nearest = others[0];
    let minDist = this.getDistance(unit, nearest);

    for (const other of others) {
      const dist = this.getDistance(unit, other);
      if (dist < minDist) {
        minDist = dist;
        nearest = other;
      } else if (dist === minDist && other.hp < nearest.hp) {
        nearest = other;
      }
    }

    return nearest;
  }

  private isInRange(attacker: Unit, target: Unit): boolean {
    const distance = this.getDistance(attacker, target);
    // Add a small buffer to range to account for continuous space overlapping
    return distance <= attacker.range + 0.5;
  }

  private moveTowards(unit: Unit, target: Unit): void {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const speed = 0.3; // loose continuous movement speed
      const moveDist = Math.min(speed, dist);
      const newX = unit.x + (dx / dist) * moveDist;
      const newY = unit.y + (dy / dist) * moveDist;

      unit.x = Math.max(0, Math.min(BOARD_CONFIG.width - 1, newX));
      unit.y = Math.max(0, Math.min(BOARD_CONFIG.height - 1, newY));

      this.logMove(unit, { x: unit.x, y: unit.y });
    }
  }

  private applySeparation(): void {
    const units = this.getAliveUnits();
    const SEPARATION_RADIUS = 0.6;
    const REPULSION_FORCE = 0.3;

    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const u1 = units[i];
        const u2 = units[j];
        const dx = u1.x - u2.x;
        const dy = u1.y - u2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < SEPARATION_RADIUS && dist > 0) {
          const overlap = SEPARATION_RADIUS - dist;
          const forceX = (dx / dist) * overlap * REPULSION_FORCE;
          const forceY = (dy / dist) * overlap * REPULSION_FORCE;
          
          u1.x += forceX;
          u1.y += forceY;
          u2.x -= forceX;
          u2.y -= forceY;
          
          u1.x = Math.max(0, Math.min(BOARD_CONFIG.width - 1, u1.x));
          u1.y = Math.max(0, Math.min(BOARD_CONFIG.height - 1, u1.y));
          u2.x = Math.max(0, Math.min(BOARD_CONFIG.width - 1, u2.x));
          u2.y = Math.max(0, Math.min(BOARD_CONFIG.height - 1, u2.y));

          // Log the subtle push to keep the renderer in sync if they don't move themselves
          this.logMove(u1, { x: u1.x, y: u1.y });
          this.logMove(u2, { x: u2.x, y: u2.y });
        }
      }
    }
  }

  private attack(attacker: Unit, target: Unit): void {
    const damageValues = [0, 1, 3];
    const damage = damageValues[Math.floor(Math.random() * damageValues.length)];
    this.logAttack(attacker, target, damage);
    target.hp -= damage;
    if (target.hp <= 0) {
      target.hp = 0;
      this.logDeath(target);
    }
    attacker.cooldown = 1000 / attacker.attackSpeed;
  }

  private processUnit(unit: Unit): void {
    if (unit.hp <= 0) return;

    if (unit.cooldown > 0) {
      return;
    }

    const target = this.findTarget(unit);
    if (!target) return;

    if (this.isInRange(unit, target)) {
      this.attack(unit, target);
    } else {
      this.moveTowards(unit, target);
    }
  }
  
  private log(event: any) {
    this.battleLog.push({ tick: this.tick, ...event });
  }

  private logMove(unit: Unit, newPosition: Position) {
    this.log({ type: 'move', unitId: unit.id, to: newPosition });
  }

  private logAttack(attacker: Unit, target: Unit, damage: number) {
    this.log({ type: 'attack', attackerId: attacker.id, targetId: target.id, damage: damage });
  }

  private logDeath(unit: Unit) {
    this.log({ type: 'death', unitId: unit.id });
  }

  private checkWinner(): string | 'draw' | null {
    const aliveUnits = this.getAliveUnits();

    if (aliveUnits.length === 1) {
      return aliveUnits[0].id;
    }
    if (aliveUnits.length === 0) {
      return 'draw';
    }
    return null;
  }

  public runSimulation(state: BoardState): SimulationResult {
    this.initializeBoard(state);

    const timeStep = 100;

    while (this.tick < MAX_TICKS * 100) {
      const winner = this.checkWinner();
      if (winner) {
        return { winner, battleLog: this.battleLog };
      }

      const allUnits = this.getAliveUnits();

      for (const unit of allUnits) {
        if(unit.cooldown > 0) {
            unit.cooldown -= timeStep;
        }
      }

      for (const unit of allUnits) {
        this.processUnit(unit);
      }

      this.applySeparation();

      this.tick += timeStep;
    }

    const alive = this.getAliveUnits();
    if (alive.length === 1) return { winner: alive[0].id, battleLog: this.battleLog };

    return { winner: 'draw', battleLog: this.battleLog };
  }

  public getBattleLog(): BattleLog {
    return this.battleLog;
  }
}

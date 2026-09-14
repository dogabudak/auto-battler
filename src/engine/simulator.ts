import { Unit, BoardState, Position, BattleLog, SimulationResult, BoardBounds, BOARD_CONFIG } from '../types/index.js';
import { AbilityTrigger, deriveAbilities, resolveAbilityAttack } from './abilities.js';

const MAX_TICKS = 500;

export class BattleSimulator {
  private units: Map<string, Unit> = new Map();
  private battleLog: BattleLog = [];
  private tick: number = 0;
  private targetMap: Map<string, string> = new Map(); // unitId -> targetId

  /**
   * Board bounds in tiles. Supplied by the caller because the grid is shaped to
   * the selected export format — a 9:16 board is tall, a 16:9 board is wide.
   */
  private readonly bounds: BoardBounds;

  constructor(bounds: BoardBounds = BOARD_CONFIG) {
    this.bounds = bounds;
  }

  /**
   * Keep a unit on the board. Clamps to `size - 1` because a unit is drawn as a
   * one-tile box whose top-left is its position, so `size - 1` is the last
   * position whose box still fits.
   */
  private clampToBoard(unit: Unit): void {
    unit.x = Math.max(0, Math.min(this.bounds.width - 1, unit.x));
    unit.y = Math.max(0, Math.min(this.bounds.height - 1, unit.y));
  }

  private cloneUnit(unit: Unit): Unit {
    return {
      ...unit,
      abilities: unit.abilities ?? deriveAbilities(unit),
      spentAbilities: [],
    };
  }

  private initializeBoard(state: BoardState): void {
    this.units.clear();
    this.battleLog = [];
    this.tick = 0;
    this.targetMap.clear();

    for (const unit of state.units) {
      this.units.set(unit.id, this.cloneUnit(unit));
    }

    // Assign each unit a random initial target
    const ids = Array.from(this.units.keys());
    for (const id of ids) {
      this.assignRandomTarget(id);
    }
  }

  private getAliveUnits(): Unit[] {
    return Array.from(this.units.values()).filter(u => u.hp > 0);
  }

  private getDistance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private assignRandomTarget(unitId: string): void {
    const others = this.getAliveUnits().filter(u => u.id !== unitId);
    if (others.length === 0) {
      this.targetMap.delete(unitId);
      return;
    }
    const pick = others[Math.floor(Math.random() * others.length)];
    this.targetMap.set(unitId, pick.id);
  }

  private findTarget(unit: Unit): Unit | null {
    const currentTargetId = this.targetMap.get(unit.id);
    if (currentTargetId) {
      const target = this.units.get(currentTargetId);
      if (target && target.hp > 0) return target;
    }
    // Current target is dead or missing — pick a new random one
    this.assignRandomTarget(unit.id);
    const newTargetId = this.targetMap.get(unit.id);
    if (!newTargetId) return null;
    return this.units.get(newTargetId) ?? null;
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

      unit.x = newX;
      unit.y = newY;
      this.clampToBoard(unit);

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
          
          this.clampToBoard(u1);
          this.clampToBoard(u2);

          // Log the subtle push to keep the renderer in sync if they don't move themselves
          this.logMove(u1, { x: u1.x, y: u1.y });
          this.logMove(u2, { x: u2.x, y: u2.y });
        }
      }
    }
  }

  private attack(attacker: Unit, target: Unit): void {
    const damageValues = [0, 1, 3];
    const baseDamage = damageValues[Math.floor(Math.random() * damageValues.length)];

    const outcome = resolveAbilityAttack(attacker, target, baseDamage);

    this.logAttack(attacker, target, outcome.damage);
    target.hp -= outcome.damage;
    if (target.hp <= 0) {
      target.hp = 0;
      this.logDeath(target);
    } else {
      // Retaliation: getting hit (or missed at) makes the target aggro onto
      // its attacker, instead of continuing to trek toward whatever far-off
      // random target it was originally assigned.
      this.targetMap.set(target.id, attacker.id);
    }
    for (const trigger of outcome.triggers) {
      this.logAbility(trigger);
    }

    // BLITZ skips the cooldown for an instant follow-up.
    attacker.cooldown = outcome.blitz ? 0 : 1000 / attacker.attackSpeed;
  }

  private processUnit(unit: Unit, hitThisTick: Set<string>): void {
    if (unit.hp <= 0) return;

    if (unit.cooldown > 0) {
      return;
    }

    const target = this.findTarget(unit);
    if (!target) return;

    if (this.isInRange(unit, target)) {
      if (hitThisTick.has(target.id)) return; // only one hit per target per tick
      hitThisTick.add(target.id);
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

  private logAbility(trigger: AbilityTrigger) {
    this.log({ type: 'ability', ...trigger });
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

      const hitThisTick = new Set<string>();
      for (const unit of allUnits) {
        this.processUnit(unit, hitThisTick);
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

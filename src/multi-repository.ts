import {
  DataObject,
  DefaultCrudRepository,
  ensurePromise,
  Entity,
  EntityNotFoundError,
  Filter,
  Options,
  juggler,
  Model,
  PropertyType,
  resolveType,
  isTypeResolver,
  FilterExcludingWhere,
  Where,
  Count,
  InvalidBodyError,
  AnyObject,
} from "@loopback/repository";
import { Request, RequestContext } from "@loopback/rest";
import { DomainRepository } from "./repositories/domain.repository";
import { Domain } from "./models/domain.model";

export class MultiRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {
  /**
   * Constructor of DefaultCrudRepository
   * @param entityClass - LoopBack 4 entity class
   * @param dataSource - Legacy juggler data source
   * @param request - The current request
   * @param context - The current request context
   * @param domainRepository - The domain repository used to fetch db names
   */
  constructor(
    // EntityClass should have type "typeof T", but that's not supported by TSC
    public entityClass: typeof Entity & { prototype: T },
    public dataSource: juggler.DataSource,
    public request: Request,
    public context: RequestContext,
    public domainRepository: DomainRepository
  ) {
    super(entityClass, dataSource);
  }

  async create(entity: DataObject<T>, options?: Options): Promise<T> {
    const currentModel = await this._getModel(this.entityClass);
    // perform persist hook
    const data = await this.entityToData(entity, options);
    const model = await ensurePromise(currentModel.create(data, options));
    return this.toEntity(model);
  }

  async createAll(entities: DataObject<T>[], options?: Options): Promise<T[]> {
    const currentModel = await this._getModel(this.entityClass);
    // perform persist hook
    const data = await Promise.all(
      entities.map((e) => this.entityToData(e, options))
    );
    const models = await ensurePromise(currentModel.createAll(data, options));
    return this.toEntities(models);
  }

  async save(entity: T, options?: Options): Promise<T> {
    const id = this.entityClass.getIdOf(entity);
    if (id == null) {
      return this.create(entity, options);
    } else {
      await this.replaceById(id, entity, options);
      return new this.entityClass(entity.toObject()) as T;
    }
  }

  async find(
    filter?: Filter<T>,
    options?: Options
  ): Promise<(T & Relations)[]> {
    const currentModel = await this._getModel(this.entityClass);
    const include = filter?.include;
    const models = await ensurePromise(
      currentModel.find(this.normalizeFilter(filter), options)
    );
    const entities = this.toEntities(models);
    return this.includeRelatedModels(entities, include, options);
  }

  async findOne(
    filter?: Filter<T>,
    options?: Options
  ): Promise<(T & Relations) | null> {
    const currentModel = await this._getModel(this.entityClass);
    const model = await ensurePromise(
      currentModel.findOne(this.normalizeFilter(filter), options)
    );
    if (!model) return null;
    const entity = this.toEntity(model);
    const include = filter?.include;
    const resolved = await this.includeRelatedModels(
      [entity],
      include,
      options
    );
    return resolved[0];
  }

  async findById(
    id: ID,
    filter?: FilterExcludingWhere<T>,
    options?: Options
  ): Promise<T & Relations> {
    const currentModel = await this._getModel(this.entityClass);
    const include = filter?.include;
    const model = await ensurePromise(
      currentModel.findById(id, this.normalizeFilter(filter), options)
    );
    if (!model) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
    const entity = this.toEntity(model);
    const resolved = await this.includeRelatedModels(
      [entity],
      include,
      options
    );
    return resolved[0];
  }

  update(entity: T, options?: Options): Promise<void> {
    return this.updateById(entity.getId(), entity, options);
  }

  async delete(entity: T, options?: Options): Promise<void> {
    // perform persist hook
    await this.entityToData(entity, options);
    return this.deleteById(entity.getId(), options);
  }

  async updateAll(
    data: DataObject<T>,
    where?: Where<T>,
    options?: Options
  ): Promise<Count> {
    const currentModel = await this._getModel(this.entityClass);
    where = where ?? {};
    const persistedData = await this.entityToData(data, options);
    const result = await ensurePromise(
      currentModel.updateAll(where, persistedData, options)
    );
    return { count: result.count };
  }

  async updateById(
    id: ID,
    data: DataObject<T>,
    options?: Options
  ): Promise<void> {
    const currentModel = await this._getModel(this.entityClass);
    if (!Object.keys(data).length) {
      throw new InvalidBodyError(this.entityClass, id);
    }
    if (id === undefined) {
      throw new Error("Invalid Argument: id cannot be undefined");
    }
    const idProp = currentModel.definition.idName();
    const where = {} as Where<T>;
    (where as AnyObject)[idProp] = id;
    const result = await this.updateAll(data, where, options);
    if (result.count === 0) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
  }

  async replaceById(
    id: ID,
    data: DataObject<T>,
    options?: Options
  ): Promise<void> {
    const currentModel = await this._getModel(this.entityClass);
    try {
      const payload = await this.entityToData(data, options);
      await ensurePromise(currentModel.replaceById(id, payload, options));
    } catch (err) {
      if (err.statusCode === 404) {
        throw new EntityNotFoundError(this.entityClass, id);
      }
      throw err;
    }
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    const currentModel = await this._getModel(this.entityClass);
    const result = await ensurePromise(currentModel.deleteAll(where, options));
    return { count: result.count };
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    const currentModel = await this._getModel(this.entityClass);
    const result = await ensurePromise(currentModel.deleteById(id, options));
    if (result.count === 0) {
      throw new EntityNotFoundError(this.entityClass, id);
    }
  }

  async count(where?: Where<T>, options?: Options): Promise<Count> {
    const currentModel = await this._getModel(this.entityClass);
    const result = await ensurePromise(currentModel.count(where, options));
    return { count: result };
  }

  async exists(id: ID, options?: Options): Promise<boolean> {
    const currentModel = await this._getModel(this.entityClass);
    const result = await ensurePromise(currentModel.exists(id, options));
    return result;
  }

  private _getModelName(name: string) {
    return name + "_app_" + this._getHostname()?.replace(/\./g, "_");
  }

  private _getHostname() {
    if (this.request.headers['x-forwarded-host']){
      return this.request.headers['x-forwarded-host'].toString().split(':')[0];
    } else {
      return this.request?.hostname;
    }
  }

  // Create an internal legacy Model attached to the datasource
  // This is specific to the domain for multi-repository
  private async _getModel(
    entityClass: typeof Model
  ): Promise<typeof juggler.PersistedModel> {
    const definition = entityClass.definition;

    const dataSource = this.dataSource;

    const modelName = this._getModelName(definition.name);

    const model = dataSource.getModel(modelName) as typeof juggler.PersistedModel;

    if (model && typeof model.find === "function") {
      // The backing persisted model has been already defined.
      return model;
    }

    const result = await this._definePersistedModelMulti(entityClass);

    return result ;
  }

  /**
   * Creates a legacy persisted model class, attaches it to the datasource and
   * returns it. This method can be overridden in sub-classes to acess methods
   * and properties in the generated model class.
   * @param entityClass - LB4 Entity constructor
   */
  private async _definePersistedModelMulti(
    entityClass: typeof Model
  ): Promise<typeof juggler.PersistedModel> {
    const dataSource = this.dataSource;
    const definition = entityClass.definition;
    const modelName = this._getModelName(definition.name);

    // To handle circular reference back to the same model,
    // we create a placeholder model that will be replaced by real one later
    dataSource.getModel(modelName, true /* forceCreate */);

    // We need to convert property definitions from PropertyDefinition
    // to plain data object because of a juggler limitation
    const properties: { [name: string]: object } = {};

    // We need to convert PropertyDefinition into the definition that
    // the juggler understands
    Object.entries(definition.properties).forEach(([key, value]) => {
      // always clone value so that we do not modify the original model definition
      // ensures that model definitions can be reused with multiple datasources
      if (value.type === "array" || value.type === Array) {
        value = Object.assign({}, value, {
          type: [
            value.itemType && this._resolvePropertyTypeMulti(value.itemType),
          ],
        });
        delete value.itemType;
      } else {
        value = Object.assign({}, value, {
          type: this._resolvePropertyTypeMulti(value.type),
        });
      }
      properties[key] = Object.assign({}, value);
    });

    const multiOptions = await this._getMultiOptions(this._getHostname().replace(/\.local$/, ''));

    const settings = { ...definition.settings, ...multiOptions };

    const modelClass = dataSource.createModel<juggler.PersistedModelClass>(
      modelName,
      properties,
      Object.assign(
        // settings that users can override
        { strict: true },
        // user-defined settings
        settings,
        // settings enforced by the framework
        { strictDelete: false }
      )
    );
    modelClass.attachTo(dataSource);
    return modelClass;
  }

  private _resolvePropertyTypeMulti(type: PropertyType): PropertyType {
    const resolved = resolveType(type);
    return isModelClass(resolved) ? this._getModel(resolved) : resolved;
  }

  private async _getMultiOptions(hostname: string) {
    const domain = hostname
      ? await this?.domainRepository?.findById(hostname)
      : undefined;
    const database = domain?.database;

    if (!database) {
      throw new EntityNotFoundError(Domain, hostname);
    }

    const collection = this.entityClass?.name;

    return {
      mongodb: {
        collection,
        database,
      },
    };
  }
}

function isModelClass(
  propertyType: PropertyType | undefined
): propertyType is typeof Model {
  return (
    !isTypeResolver(propertyType) &&
    typeof propertyType === "function" &&
    typeof (propertyType as typeof Model).definition === "object" &&
    propertyType.toString().startsWith("class ")
  );
}
